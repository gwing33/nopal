# Uncooked No.1: Creating the table

## Fields
- id:string
- type:option<'newspaper-clipping' | 'print' | 'betamax' | 'view-master-reel' | 'presentation'>]
- author:string
- title:string
- body:string
- date:datetime
- images:array<string>?
- customImage:string?
- externalUrl:string?
- instagramId:string?
  - This is the ID of the Instagram post.


## ID Thoughts
I'm wondering if the ID should just be the number or if it should include the type information.
For example, `print-no-1` or `no-1`.
The type is nice because it we can define an enum of available options.


## Markdown Migration Thoughts
Ultimately, I'd love to be able to define fields by simply writing a markdown file.
Specifcally for migrations. This way I can add comments and other documentation
about the table itself.

### Migration Naming
Similar to the overall No.tebook System naming, this should work out well for table names.

For example, this file is called `Uncooked No.1: Creating the table`, we could a new file to update the table called `Uncooked No.1: Updating the table`.

We could even reference that file/link to it.

### Expected output of this file

```
DEFINE TABLE uncooked TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD id ON uncooked TYPE string READONLY PERMISSIONS FULL;
DEFINE FIELD type ON uncooked TYPE option<'newspaper-clipping' | 'print' | 'betamax' | 'view-master-reel' | 'presentation'> PERMISSIONS FULL;
DEFINE FIELD author ON uncooked TYPE string PERMISSIONS FULL;
DEFINE FIELD title ON uncooked TYPE string PERMISSIONS FULL;
DEFINE FIELD body ON uncooked TYPE string PERMISSIONS FULL;
DEFINE FIELD date ON uncooked TYPE datetime PERMISSIONS FULL;
DEFINE FIELD images ON uncooked TYPE option<array<string>> PERMISSIONS FULL;
DEFINE FIELD images[*] ON uncooked TYPE string PERMISSIONS FULL;
DEFINE FIELD customImage ON uncooked TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD externalUrl ON uncooked TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD instagramId ON uncooked TYPE option<string> PERMISSIONS FULL;

DEFINE INDEX id ON uncooked FIELDS id;
```
