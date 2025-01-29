import { AudioFormat } from "../components/AudioFormat";
import { CostChart } from "../svg/path/CostChart";
import { BackArrow } from "../svg/arrows/BackArrow";

export default function PathFAQPage() {
  return (
    <>
      <div className="pt-16 uncooked-markdown">
        <h1 className="italic">
          {">"} How much more does it cost to build this way?
        </h1>
        <p>
          <AudioFormat />
        </p>

        <p>
          Before Nopal, we consulted and built many projects and know every
          build is unique. Different projects value different aspects.
        </p>
        <p>
          So to help answer this question, we’ll examine a few types of homes
          we’ve seen built.
        </p>
        <CostChart />
        <h2>Code Minimum House</h2>
        <p>
          This house is built as cheap and fast as possible. Often these barely
          meet code. So how do we rank this type of home?
        </p>
        <p>
          <b>Build Cost:</b> Good. Out of all the homes we’re comparing this one
          is the cheapest.
        </p>
        <p>
          <b>Operational Cost:</b> Lacking. While this isn’t the most energy
          efficient in the bunch, it is going to have the most predictable
          maintenance and home failures.
        </p>
        <p>
          <b>Health:</b> Bad. There is no air filtration and air quality is
          going to depend on the current weather.
        </p>

        <h2>Bolt-on High Performance House</h2>
        <p>
          This house is built using traditional methods. You could mistake it
          for a code minimum on first glance. They opt for spray foam and miss
          important air sealing details.
        </p>
        <p>
          <b>Build Cost:</b> Bad. These homes often end up twice as expensive as
          the code minimum.
        </p>
        <p>
          <b>Operational Cost:</b> Terrible. By opting for spray foam they’ll
          need major repairs every ~20 years, each time degrading the
          performance.
        </p>
        <p>
          <b>Health:</b> Bad. Foam is toxic and flammable.
        </p>

        <h2>Nopal Home</h2>
        <p>
          Because we use <a>our baselayer</a> that seeks to use off-the-shelf
          part that are human movable, it ends up being remarkably cost
          effective while punching above the passive house standard.
        </p>
        <p>
          <b>Build Cost:</b> Okay. We aren’t the Code minimum but we are
          significantly cheaper than the Bolt-on.
        </p>
        <p>
          <b>Operational Cost:</b> Amazing. That’s all there is to it.
        </p>
        <p>
          <b>Health:</b> Amazing. From a Zehnder to acoustic absorbsion ceiling
          to natural materials.
        </p>

        <h3>Lonjevity</h3>
        <p>
          Nopal homes are built to stay performant with minimal maintenance for
          70+ years. Repairing the home is possible with minimal effort and
          waste compared to the other types listed because of{" "}
          <a>our baselayer</a>
        </p>
        <p>
          Bolt-on high performance and code minimum homes have more serious
          points of failure. In our experience 50 years is a long time for these
          types of homes before major remodel or a complete rebuild is needed.
        </p>

        <p className="mt-8 z-10 relative">
          <a
            href="/path#faq"
            className="font-hand text-xl inline-flex items-center gap-2 -ml-8"
          >
            <BackArrow />
            Back to the Path
          </a>
        </p>
      </div>
    </>
  );
}
