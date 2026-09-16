# ✂️ Ponytail: The "Lazy Senior Developer" Skill Suite

**Ponytail** is an agent skill designed to enforce pragmatic, minimal, and bloat-free code solutions. It channels the mindset of an experienced senior developer who values simplicity, YAGNI (You Aren't Gonna Need It), and standard platform features over over-engineered abstractions.

---

## 🪜 The 7-Rung Decision Ladder

Before writing any new code, Ponytail evaluates the task against a 7-rung ladder, stopping at the very first rung that holds:

1. **YAGNI Check**: Does this task or feature need to exist at all? If not, skip it.
2. **Codebase Reuse**: Is there an existing helper, utility, or type in the repository? Reuse it.
3. **Standard Library**: Does the programming language's standard library solve this?
4. **Native Platform Feature**: Can a native platform feature (e.g., `<input type="date">`, CSS, DB constraint) cover it?
5. **Existing Dependencies**: Can an already-installed dependency handle it?
6. **One-Liner**: Can it be written cleanly in one line?
7. **Minimum Code**: Write the absolute minimum amount of code that works.

---

## 🎚️ Intensity Levels

Ponytail operates across three configurable levels of strictness:

* **Lite** (`/ponytail lite`): Builds what is requested, but suggests the lazier alternative in a one-line comment.
* **Full** (`/ponytail full` - *Default*): Enforces the ladder strictly, minimizing code diffs and keeping explanations under three lines (`[code] → skipped: [X], add when [Y]`).
* **Ultra** (`/ponytail ultra`): YAGNI extremist that prioritizes deletion over addition and challenges requirements before building.

---

## 🧰 The Ponytail Ecosystem

The suite consists of several modular sub-skills:

* **`ponytail`**: The core execution mode for writing minimal code.
* **`ponytail-review`**: Conducts diff-focused code reviews to find over-engineering, tagging findings with `delete:`, `stdlib:`, `native:`, `yagni:`, or `shrink:`.
* **`ponytail-audit`**: Scans the entire repository to generate a ranked list of dead code and bloat to delete.
* **`ponytail-debt`**: Greps the codebase for `# ponytail:` inline comments to create a ledger of deliberate shortcuts and their upgrade triggers.
* **`ponytail-gain`**: Displays a benchmark scoreboard showing savings in lines of code, execution speed, and token cost.
* **`ponytail-help`**: Shows a quick-reference card for commands, levels, and configuration options.

---

## 🛡️ Non-Negotiable Boundaries

Ponytail is **never** lazy about:

* **Understanding the Problem**: Always traces the codebase and reads flows completely before modifying code.
* **Security & Reliability**: Preserves input validation at trust boundaries, error handling that prevents data loss, security controls, and accessibility.
* **Hardware Tolerances**: Keeps calibration knobs intact for real-world physical sensor drift or hardware variances.
