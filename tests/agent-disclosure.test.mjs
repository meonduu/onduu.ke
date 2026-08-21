import assert from "node:assert/strict";
import test from "node:test";
import { fetchPath } from "./helpers/server.mjs";

// Onduu's assessment is analysed by its own agents, some of which run on
// third-party AI services (owner, 21 August 2026). Three things have to
// hold once that is true, and none of them is self-enforcing:
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
//   3. The free tools must stay out of it. /scan, /dns, /email-security
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

test("the privacy notice discloses the third-party AI services", async () => {
  const text = (await (await fetchPath("/legal/privacy")).text()).replace(/<[^>]+>/g, " ");
  assert.match(
    text,
    /third-party AI services/i,
    "the notice must say assessment content reaches third-party AI services",
  );
});

// Identifiers are stripped before anything reaches a third-party service
// (owner, 21 August 2026), which is what lets the site say your identity
// never leaves Onduu. It is the strongest claim on this subject and the
// most damaging one to get wrong: if the pipeline ever starts sending the
// name, email or company, this sentence becomes a false assurance about
// personal data rather than a stale marketing line. Pinned so the claim
// and the pipeline have to change together.
test("the de-identification claim is stated wherever the AI services are named", async () => {
  for (const path of ["/legal/privacy", "/digital-fitness"]) {
    const text = (await (await fetchPath(path)).text())
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    if (!/third-party AI services/i.test(text)) continue;
    assert.match(
      text,
      /name, email address and company name removed/i,
      `${path} names the AI services without stating what is stripped first`,
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
