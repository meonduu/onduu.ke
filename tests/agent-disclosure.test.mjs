import assert from "node:assert/strict";
import test from "node:test";
import { fetchPath } from "./helpers/server.mjs";

// Onduu's assessment is analysed by its own agents, Hermes and Buzz,
// running on servers provided by HOSTAFRICA (owner, 21-22 August 2026).
// Four things have to hold once that is true, and none is self-enforcing:
//
//   1. The privacy notice must not deny it. It carried the sentence "No
//      artificial-intelligence or language-model provider receives your
//      form submissions" — written when it was true, false the moment
//      agents were introduced. That is the same failure as the "Nothing
//      you enter here is shared with Ujiajiri" denial corrected earlier
//      the same day: a claim that outlived the arrangement it described.
//   2. The capability claim must never appear without the human review.
//      CLAUDE.md forbids promising agent accuracy. "Agents analyse your
//      evidence" alone is that promise; "a person reviews every finding
//      before the report is issued" is what makes it truthful.
//   3. The company must be named, not the software. A processor card
//      exists to tell a data subject WHICH ORGANISATION holds their
//      information; "Hermes and Buzz" answers a different question. And
//      because Onduu's operator directs HOSTAFRICA Kenya, this processor
//      is not arm's length, so the relationship is disclosed beside it.
//   4. The free tools must stay out of it. /scan, /dns, /email-security
//      and /domains are deterministic public checks with no agent
//      anywhere near them, and letting the disclosure blur across them
//      would misdescribe four tools to make one page read better.

test("no page denies that an AI provider receives assessment content", async () => {
  const paths = ["/legal/privacy", "/digital-fitness", "/legal/assessment-terms", "/contact"];
  for (const path of paths) {
    const text = (await (await fetchPath(path)).text()).replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(
      text,
      /no\s+(?:artificial[- ]intelligence|language[- ]model|AI)\s+(?:provider|service|company)/i,
      `${path} denies AI processing that now happens`,
    );
  }
});

test("the privacy notice names where the agents run, and the relationship", async () => {
  // Named 22 Aug 2026 (owner): the agents are Hermes and Buzz, running on
  // HOSTAFRICA servers. A processor card has to name the company that
  // receives the data, not the pet name of the software — and this one is
  // not arm's length, so the directorship belongs beside it.
  const text = (await (await fetchPath("/legal/privacy")).text())
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");
  assert.match(text, /HOSTAFRICA/, "the notice must name the company holding assessment content");
  assert.match(text, /Hermes/, "the agents must be named");
  assert.match(text, /Buzz/, "the agents must be named");
  assert.match(
    text,
    /director of HOSTAFRICA Kenya/i,
    "the notice must disclose that the processor is not arm's length",
  );
});

// Identifiers are stripped before anything reaches a third-party service
// (owner, 21 August 2026), which is what lets the site say your identity
// never leaves Onduu. It is the strongest claim on this subject and the
// most damaging one to get wrong: if the pipeline ever starts sending the
// name, email or company, this sentence becomes a false assurance about
// personal data rather than a stale marketing line. Pinned so the claim
// and the pipeline have to change together.
test("the de-identification claim is stated wherever the agent servers are named", async () => {
  for (const path of ["/legal/privacy", "/digital-fitness"]) {
    const text = (await (await fetchPath(path)).text())
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    if (!/HOSTAFRICA servers|servers provided by HOSTAFRICA/i.test(text)) continue;
    assert.match(
      text,
      /name, email address and company name removed/i,
      `${path} names where the agents run without stating what is stripped first`,
    );
  }
});

test("the agent claim is never made without the human review beside it", async () => {
  // The two must travel together. A page that says agents analyse the
  // evidence and stops there has promised agent accuracy by omission.
  const paths = ["/digital-fitness", "/legal/assessment-terms", "/legal/privacy"];
  for (const path of paths) {
    const text = (await (await fetchPath(path)).text())
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    if (!/agents?\b/i.test(text)) continue;
    const claimsAnalysis = /agents?[^.]{0,80}\b(?:analys|review|work through|first pass)/i.test(text);
    if (!claimsAnalysis) continue;
    assert.match(
      text,
      /\b(?:a person|human)\b[^.]{0,120}\b(?:review|check|confirm|examine)/i,
      `${path} describes agent analysis without stating the human review`,
    );
  }
});

test("the free tools are not described as agent-analysed", async () => {
  // Deterministic checks. If a future edit extends the disclosure to them
  // it is describing something the code does not do.
  for (const path of ["/scan", "/dns", "/email-security", "/domains"]) {
    const text = (await (await fetchPath(path)).text()).replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(
      text,
      /agents?\s+(?:analys|review|assess|score)/i,
      `${path} is a deterministic tool and must not claim agent analysis`,
    );
  }
});
