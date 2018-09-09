---

title: "A Guide to Formatting Code Snippets in Javadoc"
categories: [hacks]
modified: 2017-08-14
author: tom
tags: [java, javadoc, code, snippet, pre, tag, html]
comments: true
ads: true
---

{% include sidebar_right %}

Sometimes you want to add code snippets to our Javadoc comments, especially when developing
an API of some kind. But how do you mark the code snippet so that it will be rendered correctly
in the final Javadoc HTML, especially when special characters like `'<'`, `'>'` and `'@'` are involved?
Since there are multiple options to do this - each with different results -  this blog post gives 
an overview on these options and a guideline on when to use which. 

## `<pre>`, `<code>`, `{@code}`, what? 

Javadoc supports three different features for code markup. These are the HTML tags `<pre>` and `<code>`
and the Javadoc tag `{@code}`. Sounds great, but each time I want to include a code snippet 
into a Javadoc comment, I'm wondering which of the three to use and what the difference
between them actually is... .

To assemble a definitive guide on when to use which of the markup features, I took a look at how they
behave by answering the following questions for each of them: 

|Question| Rationale |
|----|----|
| Are **indentations** and **line breaks** displayed correctly in the rendered Javadoc? | For **multi-line** code snippets indentations and line breaks are essential, so they must not get lost when rendering the Javadoc. 
| Are **`'<'`** and **`'>'`** displayed correctly in the rendered Javadoc?              | `'<'` and `'>'`should not be evaluated as part of an HTML tag but instead be displayed literally. This is especially important for code snippets containing **HTML** or **XML** code or Java code containing **generics**.
| Is **`'@'`** displayed correctly in the rendered Javadoc?                             | `'@'` should not be evaluated as part of a Javadoc tag but instead be displayed literally. This is important for Java code containing **annotations**.
| Can special characters like the ones above be escaped using **HTML number codes** like `&#60;`, `&#62;` and `&#64;` (which evaluate to `'<'`, `'>'` and `'@'`)? | If the special characters **cannot be displayed literally**, they should at least be escapable via HTML codes.

### `<pre>`

`<pre>` is the default HTML tag for preformatted text. This means that HTML renderers by default know that the 
code within the tag should be displayed literally. Thus, line breaks and indentation are supported. However,
since we're in a Javadoc environment, `'@'` is evaluated as a Javadoc tag and since we're also in an HTML
environment, `'<'` and `'>'` are evaluated as HTML tags. So none of these characters will be displayed correctly
in the rendered Javadoc HTML so they have to be escaped.
 
```java
/**
 * <pre>
 * public class JavadocTest {
 *   // indentation and line breaks are kept 
 * 
 *   &#64;SuppressWarnings
 *   public List&#60;String&#62; generics(){
 *     // '@', '<' and '>'  have to be escaped with HTML codes
 *     // when used in annotations or generics
 *   }
 * } 
 * </pre>
 */
public class PreTest {}
```
renders to ...
```text
public class JavadocTest {
   // indentation and line breaks are kept 
 
   @SuppressWarnings
   public List<String> generics(){
     // '@', '<' and '>'  have to be escaped with HTML codes
     // when used in annotations or generics
   }
 } 
```


### `<code>`

Within a `<code>` tag, not even the indentation and line breaks are kept and our special characters still have to be escaped.

```java
/**
 * Using &#60;code&#62;, indentation and line breaks are lost. 
 * '@', '<' and '>'  have to be escaped with HTML codes.
 * 
 * An annotation <code>&#64;Foo</code>; and a generic List&#60;String&#62;.
 */
public class CodeHtmlTagTest {}
```
renders to ...
```text
Using <code>, indentation and line breaks are lost. '@', '<' and '>' have to be escaped with HTML codes. An annotation @Foo; and a generic List<String>.
```


### `{@code}`

`{@code}` is a Javadoc tag that [came with Java 5](http://docs.oracle.com/javase/7/docs/technotes/guides/javadoc/whatsnew-1.5.0.html).
A code snippet embedded within `{@code}` will display our special characters correctly so they don't need to be manually
escaped. However, indentation and line breaks will be lost. This can be rectified by using `{@code}` together
with `<pre>`, though (see next section).

```java
/**
 * Using {@code @code} alone, indentation will be lost, but you don't have to
 * escape special characters:
 * 
 * {@code An annotation <code>@Foo</code>; and a generic List<String>}.
 */
public class CodeJavadocTagTest {}
```
renders to ...
```text
Using @code alone, indentation will be lost, but you don't have to escape special characters: An annotation <code>@Foo</code>; and a generic List<String>.
```

### `<pre>` + `{@code}`

Combining `<pre>` and `{@code}`, indentations and line breaks are kept and `'<'` and `'>'` don't have 
to be escaped. However, against all expectations the `'@'` character is now evaluated as a Javadoc
tag. What's worse: it cannot even be escaped using the HTML number code, since the HTML number code
would be literalized by `{@code}`.

```java
/**
 * <pre>{@code 
 * public class JavadocTest {
 *   // indentation and line breaks are kept 
 * 
 *  @literal @SuppressWarnings
 *   public List<String> generics(){
 *     // '<' and '>'  are displayed correctly
 *     // '@' CANNOT be escaped with HTML code, though!
 *   }
 * } 
 * }</pre>
 */
public class PreTest {}
```
renders to ...
```text
public class JavadocTest {
    // indentation and line breaks are kept 
  
    &#64;SuppressWarnings
    public List<String> generics(){
      // '<' and '>'  are displayed correctly
      // '@' CANNOT be escaped with HTML code, though!
    }
  }
```

Note that you actually CAN escape an `'@'` using `@literal @` within the `{@code}` block. However, this way always 
renders an unwanted whitespace before the `'@'` character, which is why I don't discuss that option 
any further.

## Code Markup Features at a Glance

The following table summarizes the different javadoc code markup features.

|                                                   |  <pre>...</pre>  |   &lt;code&gt;...&lt;/code&gt; |  {@code ...} | <pre>{@code ...}</pre> |
|---------------------------------------------------|------------------|--------------------------------|--------------|------------------|
| **keep indentation & line breaks**                |  <i class="fa fa-check" style="color:green" title="supported"></i>    | <i class="fa fa-times" style="color:red" title="not supported"></i>   | <i class="fa fa-times" style="color:red" title="not supported"></i> | <i class="fa fa-check" style="color:green" title="supported"></i> |
| **display `'<'` &  `'>'`  correctly**             |  <i class="fa fa-times" style="color:red" title="not supported"></i>  | <i class="fa fa-times" style="color:red" title="not supported"></i>   | <i class="fa fa-check" style="color:green" title="supported"></i>   | <i class="fa fa-check" style="color:green" title="supported"></i> |
| **display `'@'` correctly**                       |  <i class="fa fa-times" style="color:red" title="not supported"></i>  | <i class="fa fa-times" style="color:red" title="not supported"></i>   | <i class="fa fa-check" style="color:green" title="supported"></i>   | <i class="fa fa-times" style="color:red" title="not supported"></i> |
| **escape special characters via HTML number codes**    |  <i class="fa fa-check" style="color:green" title="supported"></i>    | <i class="fa fa-check" style="color:green" title="supported"></i>     | no need to escape                                                   | <i class="fa fa-times" style="color:red" title="not supported"></i> |

## When to use which?

Looking at the table above, sadly, there is no single best option. Which option to use depends on the content of the code snippet you want
to embed in your Javadoc. The following guidelines can be derived for different situations:

|Situation| Code&nbsp;Markup&nbsp;Feature&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Rationale
|----|----|----|
| Inline code snippet | `{@code ... }` |  With `{@code ...}`, you don't need to escape special characters. For inline snippets, it doesn't matter that line breaks are lost. 
| Multi-line Java code snippets | `<pre>...</pre>` | For multi-line snippets you need line breaks. So only `<pre>...</pre>` and  `<pre>{@code ...}</pre>` are options. However, only `<pre>...</pre>` allows the use of `'@'` (escaped using HTML number codes), which you need for Java code containing annotations.
| Multi-line HTML / XML code snippets | `<pre>{@code ... }</pre>` | In HTML or XML code you probably need `'<'` and  `'>'` more often than `'@'` , so it doesn't matter that `'@'` cannot be displayed. If you need an `'@'`, you have to fall back on `<pre>` and HTML number codes.
