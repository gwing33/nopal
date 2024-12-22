type RecordId = {
  tb: string;
  id: string;
};
export function getRecordId(id: string): RecordId {
  // converts "uncooked:(print-no-1)" to a RecordId, e.g. { tb: 'uncooked', id: 'print-no-1' }
  const [tb, recordId] = id.split(":");
  // regex that grabs all content between ⟨ and ⟩
  const regex = /⟨([^>]+)⟩/;
  const matchedId = recordId.match(regex);
  return { tb, id: matchedId ? matchedId[1] : "" };
}
