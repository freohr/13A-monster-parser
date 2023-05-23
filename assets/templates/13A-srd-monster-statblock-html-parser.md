---
level: {{VALUE:level}}
role: {{VALUE:role}}
type: {{VALUE:type}}
strength: {{VALUE:size}}
tags:
alias:
    -
---
```statblock
layout: Basic 13th Age Monster Layout
columns: 1
{{VALUE:fullBlock}}
```

```js quickadd
const prompter = new customJS.Parser13AMonster.QuickAddPrompter(this);
this.variables["fullBlock"] = await prompter.promptSrdHtmlParser();
```