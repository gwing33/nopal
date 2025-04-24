import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";

export default function SunnyHomeNo1() {
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <h1 className="purple-light-text text-4xl">Sunny Home No.1</h1>
          <div className="italic green-text">
            <a
              href="https://www.google.com/maps/place/9+E+Foothill+Dr,+Phoenix,+AZ+85020/@33.5774228,-112.0756389,1038m/data=!3m2!1e3!4b1!4m6!3m5!1s0x872b6da221eb8827:0x3ddbadcf057b8e2f!8m2!3d33.5774228!4d-112.073064!16s%2Fg%2F11c2dqy24y?entry=ttu&g_ep=EgoyMDI1MDQyMC4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              9 E Foothill Dr. Phoenix, AZ
            </a>
          </div>
          <p className="text-lg mt-2 mb-4">
            This home is nestled on Foothill Dr. in Sunny Slope with direct
            access to the trails of North Mountain.
          </p>
          <div
            className="video-container"
            style={{ background: "var(--yellow-light)" }}
          ></div>

          <h2 className="green-text text-2xl mt-12">Health & Focus</h2>
          <p className="text-lg mt-2">
            It’s well known that humans feel and function better when connected
            to nature. Nature dials down the noise, letting the signal of life
            gain richness and clarity. Through biophilic design, we create a
            space arising from nature. Natural materials, deep overhangs and
            well placed glazing blurs the inside and out.
          </p>
          <img
            src="/sunny-home-no1/exterior-no1.png"
            alt="Exterior of Sunny Home No.1"
          />
          <p className="text-lg mt-2">
            Protective spaces mix with open views to bring an uncommonly calm
            interior. A place for security and contemplation.
          </p>
          <img
            src="/sunny-home-no1/interior-no1.png"
            alt="Interior of Sunny Home No.1"
          />
          <h2 className="green-text text-2xl mt-12">
            Floor Plan & Specifications
          </h2>
          <p className="text-lg mt-2">
            From the street the home is subtly hiding, nestled down and wrapped
            by dense native greenery. Guests and owners alike enter through a
            walkway sized gap and are greeted by the Engawa, a Japanese-inspired
            raised deck covered by a deep overhang for protection from the
            elements. This blurs the lines between inside and out while
            providing an elevated experience over the land.
          </p>
          <p className="text-lg mt-2">
            The home is entered through the Genkan, similar to a mudroom, but a
            more deliberate separation from the exterior to the private home.
            This is an opportunity to leave shoes, bags, and other outside
            concerns behind. Your home then invites you into an open and
            protected primary space. Natural materials, tall ceilings and glass
            to a private courtyard create a calm oasis to enjoy life.
          </p>
          <p className="text-lg mt-2">
            The Nopal building systems provide maximum health, comfort and peace
            through controlled acoustics, the elimination of hot and cold spots,
            silent heating and cooling and abundant filtered fresh air. This is
            a space for you to relax and connect.
          </p>
          <p className="text-lg mt-2">
            A “hidden” primary suite offers a daily spa retreat. Two more
            bedrooms offer flexibility through a separate entrance hall. All
            three bedrooms open onto a densely landscaped natural wash.
          </p>
          <p className="text-lg mt-2">
            The Nucleus is our central core, full of the home’s organs. Like a
            human body, this home breathes, filters and maintains itself for
            maximum longevity. The exterior shell is built with natural
            materials (like sheep’s wool and wood insulation) and represents the
            best of our knowledge from decades of healthy high performance
            construction.
          </p>
          <p className="text-lg mt-2">
            Nopal homes are the marriage of science, nature, and design brought
            to life through hands-on hard work. We don’t outsource preparing our
            ingredients, but rather work as a team to build your home with love
            and craftsmanship. We know you will experience the same joy living
            in them as we have spent creating them.
          </p>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
