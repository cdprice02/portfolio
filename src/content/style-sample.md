## A second-level heading

This paragraph holds **strong text**, _emphasis_, ~~strikethrough~~, `inline code`, and [a link](https://example.com/). It runs long enough to wrap onto a second line at phone width, so line height and measure show.

### A third-level heading

#### A fourth-level heading

##### A fifth-level heading

###### A sixth-level heading

- An unordered item
- Another item with `code` and a [link](https://example.com/)
  - A nested item

1. An ordered item
2. A second ordered item
   1. A nested ordered item

- [x] A finished task
- [ ] An open task

> A blockquote with **strong text** and a [link](https://example.com/).

| Construct |                                    Status                                    | Notes |
| --------- | :--------------------------------------------------------------------------: | ----: |
| table     |                                     seen                                     |   one |
| wide cell | a very long cell that forces the table to scroll sideways on a narrow screen |   two |

![Rocky, a dog, standing in for any image in a page body](../assets/rocky.jpg)

A paragraph with a footnote reference.[^1]

---

[^1]: The footnote text.

```rust
// Every token class: comment, keyword, function, constant, string, punctuation.
use std::collections::HashMap;

fn score(words: &[&str]) -> HashMap<String, f64> {
    let mut out = HashMap::new();
    for (i, word) in words.iter().enumerate() {
        out.insert(word.to_string(), 0.5 * i as f64 + 42.0);
    }
    out
}
```

```ts
type Theme = "light" | "dark";
const label = (t: Theme): string => `theme: ${t}`;
```

```json
{ "name": "style-sample", "count": 3, "ok": true, "none": null }
```

```bash
# Comment
pnpm build && echo "done" | tee out.txt
```

```toml
[package]
name = "sample"
edition = "2024"
```

```diff
- removed line
+ added line
```

```
A fence with no language.
```

```mermaid alt="A flowchart with a decision node: start leads to a check, which either finishes or loops back."
graph TD
  start[Start] --> check{Check}
  check -->|yes| done[Done]
  check -->|no| start
```
