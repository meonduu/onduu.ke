/**
 * One DNS query over TCP port 53 (RFC 7766) via the Workers sockets API.
 *
 * Safety envelope (spec §3 Phase 2): callers pass a PRE-VALIDATED public IP
 * — this module never resolves names and never accepts a hostname or a
 * port. Standard read-only queries only; a 3.5s timeout and the caller's
 * budget bound the work. `cloudflare:sockets` is imported lazily so the
 * module loads under plain Node (tests inject a fake instead).
 */
import { encodeQuery, parseMessage, type WireMessage } from "./dns-wire.ts";

export type TcpDnsQuery = (ip: string, qname: string, qtype: number) => Promise<WireMessage | null>;

interface TcpSocket {
  writable: WritableStream<Uint8Array>;
  readable: ReadableStream<Uint8Array>;
  close(): Promise<void>;
}

export const tcpDnsQuery: TcpDnsQuery = async (ip, qname, qtype) => {
  let socket: TcpSocket | null = null;
  try {
    const sockets = (await import(/* @vite-ignore */ "cloudflare:sockets")) as {
      connect: (opts: { hostname: string; port: number }) => TcpSocket;
    };
    const s = sockets.connect({ hostname: ip, port: 53 });
    socket = s;

    const id = Math.floor(Math.random() * 0xffff);
    const query = encodeQuery(id, qname, qtype);
    const framed = new Uint8Array(2 + query.length);
    new DataView(framed.buffer).setUint16(0, query.length);
    framed.set(query, 2);

    const exchange = (async () => {
      const writer = s.writable.getWriter();
      await writer.write(framed);
      writer.releaseLock();

      const reader = s.readable.getReader();
      let acc = new Uint8Array(0);
      let expected = -1;
      for (;;) {
        const { value, done } = await reader.read();
        if (done || !value) break;
        const merged = new Uint8Array(acc.length + value.length);
        merged.set(acc);
        merged.set(value, acc.length);
        acc = merged;
        if (expected < 0 && acc.length >= 2) expected = (acc[0] << 8) | acc[1];
        if (expected >= 0 && acc.length >= 2 + expected) break;
        if (acc.length > 65_538) break; // larger than any legal message
      }
      if (expected < 0 || acc.length < 2 + expected) return null;
      const message = parseMessage(acc.subarray(2, 2 + expected));
      return message.id === id ? message : null;
    })();

    return await Promise.race([
      exchange,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
    ]);
  } catch {
    return null;
  } finally {
    try {
      await socket?.close();
    } catch {
      /* already closed */
    }
  }
};
