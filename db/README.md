# My Learnings
This is my first time really digging into surrealDB. So listing out some basic things as I struggled with it.

### Select All
Straight forward.
```
SELECT * FROM uncooked;
```

### Select by ID
Struggled trying to figure out how to select by ID because mine had `-` in it. What got me to the right solution was searching for recordId and that brought me to what I needed.
```
SELECT * FROM uncooked:`print-no-1`;
```

### Create a record
Took me a bit to figure out the optional. But then seeing how these types are much more verbose was a great learning point and eye opener for me.
```
CREATE uncooked SET
    id = "print-no-1",
    type = "print",
    title = "A New Post",
    author = "Gerald Leenerts",
    date = d"2024-10-27T12:00:00-07:00",
      body = "The way a frame is constructed has a massive impact on building performance and quality. ~~Simple may not always look simple.~~[Simply, simple.]\n\nWelcome to Nopal, where we focus on building healthy and sustainable homes.",
    instagramId = "DBorC56SZqj";
```

### Create a schemafull table
Took me a bit to find this in surrealist, but eventually got there.

```
DEFINE TABLE uncooked TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD author ON uncooked TYPE string PERMISSIONS FULL;
DEFINE FIELD body ON uncooked TYPE string PERMISSIONS FULL;
DEFINE FIELD customImage ON uncooked TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD date ON uncooked TYPE datetime PERMISSIONS FULL;
DEFINE FIELD externalUrl ON uncooked TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD id ON uncooked TYPE string READONLY PERMISSIONS FULL;
DEFINE FIELD images ON uncooked TYPE option<array<string>> PERMISSIONS FULL;
DEFINE FIELD images[*] ON uncooked TYPE string PERMISSIONS FULL;
DEFINE FIELD instagramId ON uncooked TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD title ON uncooked TYPE string PERMISSIONS FULL;
DEFINE FIELD type ON uncooked TYPE option<'newspaper-clipping' | 'print' | 'betamax' | 'view-master-reel' | 'presentation'> PERMISSIONS FULL;

DEFINE INDEX id ON uncooked FIELDS id;
```
