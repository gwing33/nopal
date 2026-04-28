The current [@fruits_.projects.$id.tsx](../webapp/app/routes/fruits_.projects.$id.tsx) page has a lot to be desired so let's update it.

So a project is meant to present information, however as it's life changes, so will the priorities.

# The Nopal Metaphor
Nopal is core to who we are as a company. These plants are resiliant, multi use, and while not a keystone species, a key species that offers us a way forward, to exist together even though all of us are spiky.

So this means projects have different phases:
- Seed
- Sprout
- Seedling
- Flower
- Renewing

Each phase represents change, which each change we can expect a lot of the same but different. While priorities and the experience change, the real challenge is getting thrown back into the unknown.

Obviously we avoid stressful situations, but just enough stress is good for us as humans. So each phase is meant to push us humans into the unknown.


## Starting a Project
To start this project, we should have a /plant-seed page. This page is accessible to everyone.

This is the more critical page because we need to impress upon them the importance of planting and committing a seed.

Naming the seed and putting in their email is the first commitment they make. Naming should not be done lightly.

If the human is logged in, there will be no email input and we will just use the logged in email.

It should also be clear that the email is what we will use to track their project.

The email will be added as a 'client' team member on the project unless the role is admin or super. In that case they will be a guide.

Clicking the "seed selected" button takes them to the next step.

### Step 2: north star and idea overview
First item on this page is to input the scope and idea for their project. They can upload photos and files and in general use the markdown editor for however much they want to write.

The second item is the north star. We should encourage them to distill down their idea overview into 200 characters or less. Get to the essence.

Clicking a "plant seed" button should store this information in the project database and kicks off the next step

### Step 3: getting them setup
#### Logged In
If the human is logged in and a super or admin, it'll just take them to the [@fruits_.projects.$id.tsx](../webapp/app/routes/fruits_.projects.$id.tsx) url.

### Not logged in 
If the human is not logged in, here we need to add that human as a new entry in the Human table, and let's add a new role called "Maybe Human" in the [@humans.server.ts](../webapp/app/data/humans.server.ts).

For this not logged in human, we should direct them to the [@verify.tsx](../webapp/app/routes/verify.tsx) route and send them a welcome email.


## Seed Phase
Projects in this phase are in information gathering. It starts with humans pitching their ideas. Our role as guide is to understand and see if the idea has legs and is something we can help with.

In this particular view, it should feel like a conversation. It starts with pitching the idea, next is to schedule a meeting where the guide will add their internal notes. These internal notes help us gather our thoughts and foralize a response.

The human and guide are having a chat. The human can type into an input and the guide can type into an input.

In this phase the seed is largely a chat thread.

### Project View: Seed
Seed view is the start so it'll set the tone for the rest of the views. Every view should encorperate these details but they will be layered in over time.

The main focus is a "chat" style dispaly. It'll show up in the center of the main layout. On the left will have the avatars for the team member comments and on the right will be the logged in human comments.

At the top of the page that always stays visible should be the project name and basic information.

This is a bottom up scroll, meaning we have a markdown editor at the bottom of the page and the content is oldest -> newest but we start the page scrolled to the bottom.

To the left of the project title is the progress planter, which is a 120px sqare visualization, see blow.

### Transition to Sprout Phase
To move into the next phase, we need to have a signed contract. So enabling a guide craft and send out a contract is needed. To start this should be a simple document the human can sign.

Once the document is signed, the sprout phase will begin, and we'll have an intersitial screen showing the progress.

### Progress Planter Display
The progress planter is a visualzation of all the phases. So the planter is a fixed element. The scenary behind it changes with the seasons but the planter itself remains visually the same.

The seed phase we'll not 3/4" view so we can see the seeds in the pot.

The sprout phase is when we'll actually see a little nopal pad start to grow.

The Seedling phase is when it is now bigger and healtheir looking.

The flowering phase is when it grows a flower.

And the renewing phase shows a prickly pear fruit growing.

## Sprout Phase
This phase is about gathering information. This is ideation phase. We are collecting information and forming a general direction.

The UI for this phase should still center around a conversation, however we should be able to organize this information into collections. These collections have the potential to turn into manuals.

A manual can reference collecitons or collection fragments, any number of them.

### Project View: Sprout
In this phase we will add column to the left of the "chat" window. These will be our collections and manuals.

When you select a collection, it will only show chat fragments relating to that collection.

When you select a manual it'll enter a focused split view. Left side is manual with right side being the current chat view.

### Transitioning into a seedling
The end goal for sprout is there is a clear direction to go. The rough ideas are flushed out and we are ready to start the big lift of creating documents and preparing for the build.

So, a manual that has a broad view of the next step is what is needed.

## Seedling Phase
This phase is about preparing for the actual work. This means while we ended the sprout phase with a broad look at where we are going, the seedling phase is about setting up for actual work to happen.

### Prject View: Seedling
Building off the Sprout UI, here we are adding in budget.

The budget should be larger budget items with a % confidence score. Budget items will initially be hand entered.

### Transition into Flowering
To get to the flowering stage, the manuals need to be defined well enough that warrants starting the actual build process.

## Flowering Phase
The flowering phase is for tracking the actual work. Now here is where things get interesting. The flowering phase spawns seed projects, these seeds start the same cycle as defined above.

### Project View: Flowering
In this view we want to add a scheduling section. This scheduling section will be a gantt chart style display of seeds this project contains.

Yes at this point we need to to start thinking about project seeds that get created and nutured within the project. We should be able to visualzie how long they take and in what order. We don't need specific due dates and such but focus on efforts. Like half day, 1 day, 3 days, 1 week, 2 weeks, 1 month, or 6+ months.

### Transitioning to Renewing
To get to the last phase, the flower needs to be largely complete.

## Renewing Phase
This phase is about checkouts. Reviewing the work down, closing down efforts and ultimately packaging up all the knowledge into a single deliverable.

### Project View: Renewing
We add yet again to this view a list of checkout questions. Once they complete all questions, or add their own questions and answers, we'll present them with a completed button.

Completing the project bundles all the assets into a single compressed file. That can be downloaded for safe keeping. No further comments can be made.


# Technical Info
Projects refers to [@projects.server.ts](../webapp/app/data/projects.server.ts) 
Humans refers to [@humans.server.ts](../webapp/app/data/humans.server.ts) 
Markdown editor [@MdxEditorClient.tsx](../webapp/app/components/MdxEditorClient.tsx) 

All new tables should go into a single [@migrations](./db/migrations/) for this feature.

## Compressed export
Ideally we export a collection of markdown files as well as photos and file uploads that were done.
