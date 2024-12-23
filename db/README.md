# Database
I opted to go with surrealDB as it has more specific database types and seems more flexible for what I'm trying to achieve.

On top of that I was never great at traditional SQL so this also should help me reset expectations and approach it with a beginners mind.

## Pagination
One of the first concepts I need to tackle is pagination.

The biggest question I have is do I need to know the total counts?
I think counts across the board are a bad idea, so let's avoid it as much as possible.

Cursor based pagniation isn't my dream, so I think I'll just go with offset based pagination.

By this I mean we'll fetch `limit + 1` to see if there are more items after the requested amount. Can simply strip off the last item and return the rest.

This means count() queries go away.

## API Response for Collections
```
{
  data: [...],
  meta: {
    limit: 10,
    start: 10,
    nextStart: 20, // null if no more items
  },
}
```

## API Response for an Item
Simply return the JSON. Any errors should show up in the status code.
```
{ ... }
```
