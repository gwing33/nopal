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

-- Create images for other posts
FOR $record IN (SELECT id, type, images FROM uncooked WHERE images == NONE AND type != 'newspaper-clipping') {
    UPDATE $record.id SET images = [
        string::concat('/uncooked/', meta::id(id), '.jpg')
    ];
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

# Uncooked No.2.1: Swap string id for integer id
The ID was a poorly thought out approach on my part. Migrating this to add a `type_id`
```
-- Add type_id column
DEFINE FIELD type_id ON uncooked TYPE int PERMISSIONS FULL;

-- Create function to grab ID out of record.id
DEFINE FUNCTION fn::parseUncookedRecordId($name: string) {
     $split = string::split($name, '-');
    RETURN type::int($split[array::len($split) - 1]);
};

-- Test function
SELECT id, fn::parseUncookedRecordId(record::id(id)) as type_id FROM uncooked;

-- Update type_id columns
FOR $record IN (SELECT id, fn::parseUncookedRecordId(record::id(id)) as type_id FROM uncooked) {
    UPDATE $record.id SET type_id = $record.type_id;
};

-- Remove function
REMOVE FUNCTION fn::parseUncookedRecordId;

-- Create types index
DEFINE INDEX types ON uncooked FIELDS type, type_id UNIQUE;
```
