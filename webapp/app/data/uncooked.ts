export type IngredientType =
  | "newspaper-clipping"
  | "print"
  | "betamax"
  | "view-master-rell";
export type Ingredient = {
  id: string;
  type: IngredientType;
  title: string;
  author: string;
  date: Date;
  body: string;
  instagramId?: string;
};
export type Ingredients = {
  ingredients: Ingredient[];
};

const data: Ingredients = {
  ingredients: [
    {
      id: "newspaper-clipping-no-1",
      type: "newspaper-clipping",
      title: "How We Build",
      author: "Gerald Leenerts",
      date: new Date("2024-11-20T12:00:00-07:00"),
      body: "We always come back around to collaboration as a driver for how we approach construction.",
    },
    {
      id: "print-no-7",
      type: "print",
      title: "Path To Coexistance",
      author: "Gerald Leenerts",
      date: new Date("2024-11-14T12:00:00-07:00"),
      body: "The truth is often more painful than we want to admit. My hope is that by surfacing it we can look for solutions.\n\nThis quail’s home is probably on the small site we are planning to develop. Will we be able to activate a space for them to continue to thrive?",
      instagramId: "DCXa1ntz77g",
    },
    {
      id: "print-no-6",
      type: "print",
      title: "Mornings.",
      author: "Austin Trautman",
      date: new Date("2024-11-12T12:00:00-07:00"),
      body: "Morning light always holds that crisp hope of something interesting to come.",
      instagramId: "DCSIn6Gy9yx",
    },
    {
      id: "print-no-5",
      type: "print",
      title: "Dirt Desk",
      author: "Austin Trautman",
      date: new Date("2024-11-06T12:00:00-07:00"),
      body: "Our favorite place to be is outside and in the dirt. Exploring early concepts of our first Nopal build.",
      instagramId: "DCCwQwrTVk9",
    },
    {
      id: "print-no-4",
      type: "print",
      title: "Bento Box of Nature",
      author: "Austin Trautman",
      date: new Date("2024-11-04T12:00:00-07:00"),
      body: "I had a grand plan of covering the side of a building with these vines.",
      instagramId: "DB91eF4SWeT",
    },
    {
      id: "betamax-no-1",
      type: "betamax",
      title: "A Focus on Nature",
      author: "Austin Trautman",
      date: new Date("2024-11-04T12:00:00-07:00"),
      body: "A human connection to nature and a deep understanding of existing well within the Sonoran Desert is core to Nopal.",
      instagramId: "DB9j72eBK7v",
    },
    {
      id: "print-no-3",
      type: "print",
      title: "Natural Business",
      author: "Austin Trautman",
      date: new Date("2024-11-01T12:00:00-07:00"),
      body: "This is how we conduct business meetings, in nature and with laughter.",
      instagramId: "DB1o-Qwy89D",
    },
    {
      id: "print-no-2",
      type: "print",
      title: "Opuntia On Site",
      author: "Austin Trautman",
      date: new Date("2024-10-29T12:00:00-07:00"),
      body: "At the core of Nopal is curiosity. One curiosity we always hold is our relationship with nature.\n\nbiophilia, biomimicry, or just sitting with a cactus for a bit. We have so much to gain as humans within nature.\n\nPS - Gerald in the background is busy scouting out a killer build site!",
      instagramId: "DBuawVnSXhX",
    },
    {
      id: "print-no-1",
      type: "print",
      title: "A New Post",
      author: "Gerald Leenerts",
      date: new Date("2024-10-27T12:00:00-07:00"),
      body: "The way a frame is constructed has a massive impact on building performance and quality. Simple may not always look simple.\n\nWelcome to Nopal, where we focus on building healthy and sustainable homes.",
      instagramId: "DBorC56SZqj",
    },
  ],
};

export function getUncookedIngredients(): Ingredients {
  return data;
}
