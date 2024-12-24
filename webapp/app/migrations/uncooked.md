# Migration No.1: Uncooked

These are thoughts that are not yet fully formed.
They are the raw materials that will be used to create the final product.

- ${id:string}
  - The ID should always be formated as `type-no-1` where `type` is the type of uncooked thought and `1` is the number of the thought.
- ${type:option<'newspaper-clipping' | 'print' | 'betamax' | 'view-master-reel' | 'presentation'>}
  - The type should also be a complete enum list of what is available.
- ${author:string}
- ${title:string}
- ${body:string}
- ${date:datetime}
- ${images:array<string>?}
- ${customImage:string?}
- ${externalUrl:string?}
- ${instagramId:string?}: Just the ID, not the full URL.
