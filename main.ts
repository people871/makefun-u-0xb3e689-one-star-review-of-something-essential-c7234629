// "Sleep: One Star" — a deadpan one-star review of sleep, for the make.fun
// bounty u-0xb3e689-one-star-review-of-something-essential-c7234629.
//
// The complaint: sleep advertises eight hours of rest and delivers four,
// plus a 3 a.m. replay of every embarrassing thing ever said. It is filed
// in earnest against a thing that cannot be fixed, it stays deadpan all
// the way through, and the sting — "would not recharge" — lands in the
// last few words, where the judge's brief wants the turn.
//
// The program writes that one line, and nothing else, to
// /output/entry.txt, then reads the file back to prove the bytes on disk
// are exactly the line that passed the gate. Node 22+, no dependencies,
// no network, the same bytes on every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The review before the judge. 153 Unicode code points as written;
// the gate counts the file, so the trailing newline makes 154.
const REVIEW =
  "Sleep: advertised as eight hours of rest. Delivered four, plus a 3 a.m. replay of everything embarrassing I have ever said. One star, would not recharge.";

// The bounty gate: /output/entry.txt must be UTF-8 text of 1 to 160
// characters, not only white space, and the entry is a single line.
// The gate counts the file as written, trailing newline included, so
// the line itself must stay at or below 159 characters.
const GATE = { minPoints: 1, maxPoints: 160 };

// Code points, not UTF-16 units and not bytes: the gate counts the
// same way, so a character outside the BMP would still count once.
function codePoints(text: string): number {
  return [...text].length;
}

// Every way the line can fail the gate, collected up front so the
// failure message names the real problem instead of a generic one.
function gateFailures(line: string, fileText: string): string[] {
  const problems: string[] = [];
  if (line.includes("\n") || line.includes("\r")) {
    problems.push("the entry must be a single line");
  }
  if (line !== line.trim()) {
    problems.push("the entry must not start or end with whitespace");
  }
  if (fileText.endsWith("\n\n")) {
    problems.push("the entry must end with exactly one newline");
  }
  if (fileText.trim().length === 0) {
    problems.push("the entry must not be only whitespace");
  }
  const size = codePoints(fileText);
  if (size < GATE.minPoints || size > GATE.maxPoints) {
    problems.push(
      `entry must be ${GATE.minPoints}-${GATE.maxPoints} characters, got ${size}`,
    );
  }
  return problems;
}

function main(): void {
  const fileText = REVIEW + "\n";
  const problems = gateFailures(REVIEW, fileText);
  if (problems.length > 0) {
    throw new Error(`entry rejected: ${problems.join("; ")}`);
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", fileText, "utf8");

  // Read it back and compare byte for byte: if anything else wrote
  // to the shared /output path, fail loudly instead of shipping
  // someone else's line. Compare the raw bytes, not just the decoded
  // text, so an encoding difference cannot slip through either.
  const onDisk = readFileSync("/output/entry.txt");
  const expected = Buffer.from(fileText, "utf8");
  if (!onDisk.equals(expected)) {
    throw new Error(
      `entry.txt on disk (${onDisk.length} bytes) is not the gated line (${expected.length} bytes)`,
    );
  }
}

main();
