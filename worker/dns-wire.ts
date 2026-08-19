/**
 * Minimal DNS wire-format codec (RFC 1035) for the Phase 2 parent and
 * per-server probes (spec: docs/specs/dns-check.md §3, Phase 2).
 *
 * Encodes a single NON-recursive question (RD=0 — we want the queried
 * server's own view, not a cached recursive answer) and parses only the
 * record types the probes read: A, AAAA, NS and SOA, with full
 * name-compression support. TCP framing lives in dns-tcp.ts.
 */

export interface WireRecord {
  name: string;
  type: number;
  ttl: number;
  /** A/AAAA: address text · NS: target host · SOA: seven fields, spaced. */
  data: string;
}

export interface WireMessage {
  id: number;
  rcode: number;
  answers: WireRecord[];
  authority: WireRecord[];
  additional: WireRecord[];
}

export const QTYPE = { A: 1, NS: 2, SOA: 6, AAAA: 28 } as const;

export function encodeQuery(id: number, qname: string, qtype: number): Uint8Array {
  const labels = qname.replace(/\.$/, "").split(".");
  const nameLen = labels.reduce((n, l) => n + 1 + l.length, 1);
  const buf = new Uint8Array(12 + nameLen + 4);
  const dv = new DataView(buf.buffer);
  dv.setUint16(0, id);
  dv.setUint16(2, 0x0000); // QR=0, opcode=0, RD=0
  dv.setUint16(4, 1); // one question
  let o = 12;
  for (const label of labels) {
    buf[o++] = label.length;
    for (let i = 0; i < label.length; i++) buf[o++] = label.charCodeAt(i);
  }
  buf[o++] = 0;
  dv.setUint16(o, qtype);
  dv.setUint16(o + 2, 1); // class IN
  return buf;
}

/** Read a possibly-compressed name. Returns the name and the offset just
 * past it in the original (non-pointer) position. Loop-guarded so a
 * malicious pointer cycle throws instead of hanging. */
function parseName(buf: Uint8Array, offset: number): { name: string; next: number } {
  const labels: string[] = [];
  let o = offset;
  let next = offset;
  let jumped = false;
  let hops = 0;
  for (;;) {
    if (o >= buf.length || hops++ > 64) throw new Error("malformed name");
    const len = buf[o];
    if (len === 0) {
      if (!jumped) next = o + 1;
      break;
    }
    if ((len & 0xc0) === 0xc0) {
      if (o + 1 >= buf.length) throw new Error("malformed pointer");
      if (!jumped) next = o + 2;
      jumped = true;
      o = ((len & 0x3f) << 8) | buf[o + 1];
      continue;
    }
    if (o + 1 + len > buf.length) throw new Error("label overrun");
    labels.push(String.fromCharCode(...buf.subarray(o + 1, o + 1 + len)));
    o += 1 + len;
  }
  return { name: labels.join(".").toLowerCase(), next };
}

export function parseMessage(buf: Uint8Array): WireMessage {
  if (buf.length < 12) throw new Error("short message");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const id = dv.getUint16(0);
  const rcode = dv.getUint16(2) & 0x0f;
  const qd = dv.getUint16(4);
  const counts = [dv.getUint16(6), dv.getUint16(8), dv.getUint16(10)];
  let o = 12;
  for (let q = 0; q < qd; q++) o = parseName(buf, o).next + 4;

  const readSection = (n: number): WireRecord[] => {
    const out: WireRecord[] = [];
    for (let i = 0; i < n; i++) {
      const parsed = parseName(buf, o);
      o = parsed.next;
      if (o + 10 > buf.length) throw new Error("truncated record");
      const type = dv.getUint16(o);
      const ttl = dv.getUint32(o + 4);
      const rdlen = dv.getUint16(o + 8);
      o += 10;
      if (o + rdlen > buf.length) throw new Error("truncated rdata");
      let data = "";
      if (type === QTYPE.A && rdlen === 4) {
        data = [...buf.subarray(o, o + 4)].join(".");
      } else if (type === QTYPE.AAAA && rdlen === 16) {
        const parts: string[] = [];
        for (let j = 0; j < 16; j += 2) parts.push(dv.getUint16(o + j).toString(16));
        data = parts.join(":");
      } else if (type === QTYPE.NS) {
        data = parseName(buf, o).name;
      } else if (type === QTYPE.SOA) {
        const m = parseName(buf, o);
        const r = parseName(buf, m.next);
        const so = r.next;
        if (so + 20 > buf.length) throw new Error("truncated soa");
        data = [
          m.name,
          r.name,
          dv.getUint32(so),
          dv.getUint32(so + 4),
          dv.getUint32(so + 8),
          dv.getUint32(so + 12),
          dv.getUint32(so + 16),
        ].join(" ");
      }
      o += rdlen;
      out.push({ name: parsed.name, type, ttl, data });
    }
    return out;
  };

  const answers = readSection(counts[0]);
  const authority = readSection(counts[1]);
  const additional = readSection(counts[2]);
  return { id, rcode, answers, authority, additional };
}
