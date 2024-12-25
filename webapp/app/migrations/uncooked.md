# Migration No.1: Uncooked

These are thoughts that are not yet fully formed.
They are the raw materials that will be used to create the final product.

## [Field: id, string]
I'm wondering if the ID should just be the number or if it should include the type information.
For example, `print-no-1` or `no-1`.
The type is nice because it we can define an enum of available options.

## Other fields
- [Field: type, option<'newspaper-clipping' | 'print' | 'betamax' | 'view-master-reel' | 'presentation'>]
- [Field: author, string]
- [Field: title, string]
- [Field: body, string]
- [Field: date, datetime]
- [Field: images, array<string>?]
- [Field: externalUrl, string?]
- [Field: instagramId, string?]: Just the ID, not the full URL.
