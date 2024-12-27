# Uncooked No.2: Remove customImage and instagramId
This was a poor design on my part. I simplified the instagram URL to use just the ID, but I should have just used the ID.

The customImage could just use the images array instead too. Both of these should be removed.

## Migration
I'm not sure just yet how to run the script that first migrates the data over.
There are a few appraoches I have in my head but this document will help to server what I need to do.

### FOR
I think this is what I need. While looking into this I realized I also need to migrate the id over to images:

```
-- Update all records to use the images array rather than the ID
FOR $record IN (SELECT * FROM uncooked where customImage == NONE AND images IS NONE AND type != 'newspaper-clipping') {
    UPDATE $record.id SET images = [
        string::concat('/uncooked/', record::id($record.id), '.jpg')
    ];
};

-- Move customImages over to images
FOR $record IN (SELECT id, customImage, images FROM uncooked where customImage != NONE) {
    UPDATE $record.id SET images = [$record.customImage];
}

-- Remove the customImage field
REMOVE FIELD customImage FROM uncooked;

-- Migrate instagramId to externalUrl
FOR $record IN (SELECT * FROM uncooked WHERE instagramId != NONE) {
    UPDATE $record.id SET externalUrl = string::concat('https://www.instagram.com/p/', instagramId);
};

-- Remove instagramId field
REMOVE FIELD instagramId ON uncooked;

-- Lastly update the uncooked table
Update uncooked;
```
