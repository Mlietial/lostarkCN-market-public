# Windows shell and encoding rules

- On Windows, use PowerShell 7 through `pwsh.exe`.
- Do not rely on Windows PowerShell 5.1 `powershell.exe` for project commands.
- For complex shell commands, wrap them as:
  `pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "..."`
- All Chinese text files must be written as UTF-8 no BOM.
- Use `Set-Content -Encoding utf8NoBOM`, `Add-Content -Encoding utf8NoBOM`, or `Out-File -Encoding utf8NoBOM`.
- Do not use `echo > file` for Chinese content.
- HTML files must include `<meta charset="UTF-8">`.
- JSON, JS, CSS, TXT, HTML files must be saved as UTF-8.

## User workflow preference

- The user prefers to verify results personally.
- After completing requested changes, do not repeatedly validate data correctness unless the user explicitly asks.
- Do not repeatedly run tests, builds, lint checks, screenshots, diffs, or data comparisons just to confirm completion.
- Complete the requested edit directly, then respond briefly with what was changed.
- Acceptable final response style: “已完成，主要修改了……”
- Only mention problems if there is a clear execution failure, syntax error, file write failure, or obvious risk of breaking the project.
- For small edits, commit and push to GitHub directly after completing the requested change; do not ask for confirmation.
- Before committing, stage only files related to the current task and leave unrelated or temporary files uncommitted.

## Windows shell and encoding rules

- On Windows, use PowerShell 7 through `pwsh.exe`.
- Do not rely on Windows PowerShell 5.1 `powershell.exe`.
- For complex shell commands, wrap them as:
  `pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "..."`
- All Chinese text files must be written as UTF-8 no BOM.
- Use `Set-Content -Encoding utf8NoBOM`, `Add-Content -Encoding utf8NoBOM`, or `Out-File -Encoding utf8NoBOM`.
- Do not use `echo > file` for Chinese content.
- HTML files must include `<meta charset="UTF-8">`.
- JSON, JS, CSS, TXT, HTML files must be saved as UTF-8.
