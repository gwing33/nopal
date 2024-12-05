export type IngredientType =
  | "newspaper-clipping"
  | "print"
  | "betamax"
  | "view-master-reel";

export type Ingredient = {
  id: string;
  type: IngredientType;
  title: string;
  author: string;
  date: string;
  body: string;
  instagramId?: string;
  images?: string[];
};
export type Ingredients = {
  ingredients: Ingredient[];
};

const data: Ingredients = {
  ingredients: [
    {
      id: "view-master-reel-no-2",
      type: "view-master-reel",
      title: "Currently, real open.",
      author: "Austin Trautman",
      date: "2024-12-06T12:00:00-07:00",
      body: "Open joint Black Locust cladding on a rainscreen over Pro Clima Fronta Quattro.",
      instagramId: undefined,
      images: ["view-master-reel-no-3-1", "view-master-reel-no-3-2"],
    },
    {
      id: "print-no-12",
      type: "print",
      title: "Jean Clad Van Damme",
      author: "Austin Trautman",
      date: "2024-12-06T12:00:00-07:00",
      body: "A stack of rich Black Locust cladding eagerly waiting to clad this ADU.  It smells so good.",
      instagramId: undefined,
    },
    {
      id: "print-no-11",
      type: "print",
      title: "Family Reunion",
      author: "Austin Trautman",
      date: "2024-12-05T12:00:00-07:00",
      body: "Welcome home, ~~friend~~[son].",
      instagramId: "DDNIGlLhDIW",
    },
    {
      id: "newspaper-clipping-no-1",
      type: "newspaper-clipping",
      title: "Fresh Air",
      author: "Austin Trautman",
      date: "2024-11-30T12:00:00-07:00",
      body: "We have all heard the cliche you are what you eat.  We are also what we breathe.  In the simplest sense, this is all we can be.  Our bodies continuously break down and rebuild from what we put in them over time.",
    },
    {
      id: "print-no-10",
      type: "print",
      title: "Desert Dwellers",
      author: "Austin Trautman",
      date: "2024-11-27T12:00:00-07:00",
      body: 'Arabian Jasmine - one of our favorite recent "discoveries" as a desert plant that does oddly well in our climate with minimal water.',
      instagramId: "DC1uyv2Mw05",
    },
    {
      id: "print-no-9",
      type: "print",
      title: "Felt Nature",
      author: "Austin Trautman",
      date: "2024-11-26T12:00:00-07:00",
      body: "Working in nature is ~~always~~ the way to go.",
      instagramId: "DC1uyv2Mw05",
    },
    {
      id: "view-master-reel-no-2",
      type: "view-master-reel",
      title: "Post Jig",
      author: "Austin Trautman",
      date: "2024-11-25T12:00:00-07:00",
      body: "Getting jig-gy with it.",
      instagramId: "DCzVklgCNZu",
      images: [
        "view-master-reel-no-2-1",
        "view-master-reel-no-2-2",
        "view-master-reel-no-2-3",
      ],
    },
    {
      id: "print-no-8",
      type: "print",
      title: "Wool ❤️ Felt",
      author: "Austin Trautman",
      date: "2024-11-23T12:00:00-07:00",
      body: "With 3\" of open space filled with Sheep's wool and finished with acoustic felt, this ceiling system absorbs sound across the entire audible range while also filtering interior air and ^[please hold...] buffering humidity.",
      instagramId: "DCt67LOtqQA",
    },
    {
      id: "view-master-reel-no-1",
      type: "view-master-reel",
      title: "Felt Like Home",
      author: "Austin Trautman",
      date: "2024-11-22T12:00:00-07:00",
      body: "On the search for the ~~perfect Nopal~~[ideal] ceiling. Experimenting with colorful and acoustic felt.",
      instagramId: "DCsdUCxsvVn",
      images: [
        "view-master-reel-no-1-1",
        "view-master-reel-no-1-2",
        "view-master-reel-no-1-3",
      ],
    },
    {
      id: "print-no-7",
      type: "print",
      title: "Path To Coexistance",
      author: "Gerald Leenerts",
      date: "2024-11-14T12:00:00-07:00",
      body: `The truth is often more painful than we want to admit. My hope is that by surfacing it we can look for solutions.

This ^[poor] quail’s home is probably on the small site we are planning to develop. Will we be able to activate a space for them to continue to thrive?`,
      instagramId: "DCXa1ntz77g",
    },
    {
      id: "print-no-6",
      type: "print",
      title: "Mornings.",
      author: "Austin Trautman",
      date: "2024-11-12T12:00:00-07:00",
      body: "Morning light always holds that crisp hope of something interesting to come.",
      instagramId: "DCSIn6Gy9yx",
    },
    {
      id: "print-no-5",
      type: "print",
      title: "Dirt Desk",
      author: "Austin Trautman",
      date: "2024-11-06T12:00:00-07:00",
      body: "Our favorite ~~place to be~~[office] is outside and in the dirt. Exploring early concepts of our first Nopal build.",
      instagramId: "DCCwQwrTVk9",
    },
    {
      id: "print-no-4",
      type: "print",
      title: "Bento Box of Nature",
      author: "Austin Trautman",
      date: "2024-11-04T12:00:00-07:00",
      body: "I had a grand plan of covering the side of a building with ~~these vines~~[what species?].",
      instagramId: "DB91eF4SWeT",
    },
    {
      id: "betamax-no-1",
      type: "betamax",
      title: "A Focus on Nature",
      author: "Austin Trautman",
      date: "2024-11-04T12:00:00-07:00",
      body: "A human connection to nature and a deep understanding of existing well within the Sonoran Desert is core to Nopal.",
      instagramId: "DB9j72eBK7v",
    },
    {
      id: "print-no-3",
      type: "print",
      title: "Natural Business",
      author: "Austin Trautman",
      date: "2024-11-01T12:00:00-07:00",
      body: "~~This is how we conduct~~[The original] business meeting~~s~~, in nature and with laughter.",
      instagramId: "DB1o-Qwy89D",
    },
    {
      id: "print-no-2",
      type: "print",
      title: "Opuntia On Site",
      author: "Austin Trautman",
      date: "2024-10-29T12:00:00-07:00",
      body: `At the core of Nopal is curiosity. One curiosity we always hold is our relationship with nature.

biophilia, biomimicry, or just sitting with a cactus for a bit. We have so much to gain as humans within nature.

PS - Gerald in the background is busy scouting out a killer build site!`,
      instagramId: "DBuawVnSXhX",
    },
    {
      id: "print-no-1",
      type: "print",
      title: "A New Post",
      author: "Gerald Leenerts",
      date: "2024-10-27T12:00:00-07:00",
      body: `The way a frame is constructed has a massive impact on building performance and quality. ~~Simple may not always look simple.~~[Simply, simple.]

Welcome to Nopal, where we focus on building healthy and sustainable homes.`,
      instagramId: "DBorC56SZqj",
    },
  ],
};

export function getUncookedIngredients(): Ingredients {
  return data;
}
