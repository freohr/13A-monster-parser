---
level: {{VALUE:level}}
role: {{VALUE:role}}
type: {{VALUE:type}}
strength: {{VALUE:size}}
tags:
{{VALUE:tags}}
alias:
    -
---
```statblock
columns: 1
{{VALUE:fullBlock}}
```
```js quickadd
const prompter = new customJS.Parser13AMonster.QuickAddPrompter(this)
console.log(this);
this.variables["fullBlock"] = await prompter.promptMinimalistParser();
```