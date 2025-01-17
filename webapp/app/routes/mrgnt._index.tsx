import { Link, Outlet } from "@remix-run/react";

export default function Mrgnt() {
  return (
    <>
      <div className="md-content">
        <div className="mdmdmdmdmdmdmdmd">
          A lot of goals, clocks rewind. Some fall to action, others need time.
          Below a list, thoughts of mind. Enjoy the process, as will mine.
          <h1># Goal</h1>
          <p>
            The purpose of this site is singularly focused on organization. How
            can we better organize our thoughts, process, tasks, or
            documentation? How can we organize these such that others get looped
            in at the right time? How can it be simple and quick no matter the
            modality?
          </p>
          <h2>## Organization</h2>
          <p>
            Be militant on organization. When we organize our thoughts, we
            naturally communicate to others in a way that inspires.
          </p>
          <p>
            Think of it this way, when you organize your thoughts for others,
            you change the way you talk. One of telling someone facts vs one
            that is sharing a story.
          </p>
          <p>
            Facts are simply part of a story, they are needed to make the story.
          </p>
          <h2>## Story</h2>
          <p>
            The nice thing about story is we can communicate this in multiple
            different formats. Typing, images, video, audio, or doodles on a
            paper. These things all lend small piece of the overall story.
          </p>
          <h2>## Fin</h2>
          <p>
            In the end, the more thoughts we can capture and organize, the more
            interesting our story is.
          </p>
        </div>
        <div className="annotations">
          <div className="annoiting" style={{ marginTop: "20%" }}>
            I should be able to add this annotation whever I like!
          </div>
          <div
            className="annoiting"
            style={{
              marginTop: "40%",
            }}
          >
            But I should be limited, because in the real world a paper is only
            so big. So you can't just keep on writing as you run out of physical
            space. It's absurd quite frankly. If you have a thought that takes
            up an entire page, fine. Turn. The. Page. Seriously. Turn it.
          </div>
        </div>
      </div>
    </>
  );
}
