# Hayabusa-http
>
> Haybusa HTTP is a lightweight and fast backend framework. You can customize it to your liking by adding the libraries you want.

## wildcard

### Notice

- The wildcard must be the last segment.
- It must not be in the middle of the URL.

### Example

- Wildcards can be retrieved from the params variable.
- The names of wildcards included in the written URL are automatically inferred.

```ts
app.get("/wildcard/test/*wildcard", async (req) => {
  return {
    wildcard: req.params.wildcard
  }
});
```
