import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";

export default function SCCDemo() {
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <h1 className="text-4xl font-bold mt-8">Demo Wall</h1>
          <h2 className="purple-light-text text-xl">
            Scottsdale Community College
          </h2>
          <p className="mt-8 mb-8 text-lg">
            While Austin and Lucas were looking to take a leak, they came across
            this demo wall. It showed a classic example of building science gone
            wrong and we asked to fix it.
          </p>
          <div className="video-container">
            <iframe
              width="600"
              height="315"
              src="https://www.youtube-nocookie.com/embed/6eeD2D8stHg?si=0YlI2HEMSVtIdLay"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>

          <h3 className="green-text text-3xl mt-12">Why It Needs Fixin’</h3>

          <p className="mt-2 text-lg">
            The kraft paper facing was supposed to create some air control, and
            minimize water vapor movement into walls, but the performance wasn’t
            sufficient and it was almost never installed to manufacturer’s
            specifications; staple the kraft paper across stud bays and then
            tape over the studs to make it somewhat continuous.
          </p>
          <p className="mt-4 text-lg">
            <em className="font-bold">Health:</em> Fiberglass breaks down over
            time, which results in dust that makes you cough, itch, and
            potentially much worse.
          </p>
          <p className="mt-4 text-lg">
            <em className="font-bold">Carbon:</em> Fiberglass takes a lot of
            energy to harvest the ingredients and manufacture them into the
            final product, so it has a relatively large amount of embodied
            carbon.
          </p>
          <p className="mt-4 text-lg">
            <em className="font-bold">Performance #1:</em> Rated R-value is very
            different than a reality adjusted R-value. Due to the “gaps, voids,
            and compressions”, and being poorly wrapped around electrical wires,
            the real world performance is at least 50% lower than the rated
            R-value.
          </p>
          <p className="mt-4 text-lg">
            <em className="font-bold">Performance #2:</em> Fiberglass is low
            density and made of glass, so it has poor thermal performance in
            Desert climates due to large diurnal temperature swings.
          </p>

          <h3 className="green-text text-3xl mt-12">
            Bringing the Wall Into the 21st Century
          </h3>

          <p className="mt-2 text-lg">
            Intello Plus with Havelock wool is the modern-day incarnation of
            what fiberglass and kraft interior facing hoped to achieve. Wool
            looks kind of like fiberglass but nature’s fibers offer improvements
            in every area.
          </p>

          <p className="mt-4 text-lg">
            <em className="font-bold">Health:</em> Wool captures toxins instead
            of releasing them, improves humidity levels by buffering moisture,
            and no itchy skin while installing.
          </p>

          <p className="mt-4 text-lg">
            <em className="font-bold">Carbon:</em> Havelock wool is a waste
            product of the wool industry, and it is a renewable resource.
          </p>

          <p className="mt-4 text-lg">
            <em className="font-bold">Performance:</em> Intello Plus achieves
            what kraft interior facing hoped to. A more precise vapor profile
            that adapts to seasons and keeps walls dry along with absolute
            airtightness and a less fussy install.
          </p>

          <p className="mt-12 italic text-lg">More information coming soon.</p>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
