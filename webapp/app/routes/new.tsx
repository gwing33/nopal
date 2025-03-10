import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { LongJohns } from "../svg/baselayer/LongJohns";
import { LongJohnHouse } from "../svg/baselayer/LongJohnHouse";
import { FabricLayers } from "../svg/baselayer/FabricLayers";
import { Insulation } from "../svg/baselayer/Insulation";
import { Framing } from "../svg/baselayer/Framing";
import { ControlLayers } from "../svg/baselayer/ControlLayers";
import { Mechanicals } from "../svg/baselayer/Mechanicals";

import styles from "../styles/home-new.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export default function Index() {
  return (
    <Layout>
      <main>
        <BaselayerInfo />
        <BaselayerExploded />
        <WhatWeDo />
      </main>
    </Layout>
  );
}

function BaselayerInfo() {
  return (
    <section id="baselayerInfo">
      <div className="info simple-container">
        <h2 className="title mt-8">Baselayer</h2>
        <p className="subtitle">noun</p>
        <p>
          a{" "}
          <span>
            <FramedBuildingAnnotation />
            <del>piece of clothing</del>
          </span>{" "}
          worn under your{" "}
          <span>
            <HomeFinishesAnnotation />
            <del>other clothes</del>
          </span>
          , made of <span className="newAnnotation">natural</span> material that
          is designed to keep you warm and dry.
        </p>
        <div id="orCool" className="newAnnotation">
          <span className="newAnnotation">^</span>
          <span>(or cool)</span>
        </div>
      </div>
      <div id="houseOutfitImages">
        <div id="outfit-svg">
          <LongJohns />
        </div>
        <div id="but-for-house">
          <span className="newAnnotation">but...</span>
          <div className="arrow">
            <svg
              viewBox="0 0 191 42"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.77"
                d="M1.00038 0.845601C1.00038 0.845601 84.7402 4.0243 149.995 23.1099C165.239 27.5687 189.417 33.1153 189.417 33.1153M189.417 33.1153L181.417 20.4375C180.453 18.9096 178.118 19.3419 177.764 21.1137L174.26 38.6862C173.916 40.4095 175.803 41.7065 177.289 40.7688L189.417 33.1153Z"
                className="svg-red"
              />
            </svg>
          </div>
          <span className="forHouse newAnnotation">for your house!</span>
        </div>
        <div id="house-outfit">
          <LongJohnHouse />
        </div>
        <div id="breathe-naturally" className="newAnnotation">
          <svg
            width="26"
            height="86"
            viewBox="0 0 26 86"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.77"
              d="M0.645696 85.5041C0.645696 85.5041 15.2717 66.4869 14.5821 42.1747C14.1317 26.2975 14.3211 1.50306 14.3211 1.50306M14.3211 1.50306L4.07094 12.442C2.83564 13.7604 3.84298 15.9111 5.64656 15.8062L23.5348 14.7651C25.289 14.663 26.0684 12.5106 24.7861 11.3091L14.3211 1.50306Z"
              className="svg-red"
            />
          </svg>
          <span>Naturally breathes</span>
        </div>
        <div id="manages" className="newAnnotation">
          <svg
            viewBox="0 0 73 54"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.77"
              d="M72.0002 53.5034C72.0002 53.5034 62.6007 28.0807 39.4432 20.6448C24.3201 15.7887 1.00032 7.36343 1.00032 7.36343M1.00032 7.36343L7.90731 20.6683C8.73971 22.2718 11.1031 22.0372 11.604 20.3013L16.5718 3.08528C17.059 1.39697 15.2883 -0.0539032 13.7288 0.755716L1.00032 7.36343Z"
              className="svg-red"
            />
          </svg>
          <span>Manages</span>
          <ul>
            <li>- Temp</li>
            <li>- Humidity</li>
            <li>- CO2</li>
            <li>- and more!</li>
          </ul>
        </div>
      </div>
      <div id="element-layers" className="simple-container">
        <div id="the-layers" className="newAnnotation">
          <FabricLayers />
          <span id="exterior-layer">Element Resistant Exterior Layer</span>
          <span id="nopal-layer">Nopal Baselayer</span>
          <span id="interior-layer">Interior Comfort Layer</span>
          <svg
            className="arrow"
            viewBox="0 0 127 188"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.77"
              d="M1.00011 0.998889C1.00011 0.998889 43.3677 114.387 94.6005 159.081C106.57 169.523 126.192 184.698 126.192 184.698M126.192 184.698L124.246 169.834C124.012 168.043 121.711 167.456 120.647 168.916L110.096 183.398C109.061 184.819 110.229 186.787 111.972 186.559L126.192 184.698Z"
              className="svg-red"
            />
          </svg>
        </div>
        <p>
          Just like long underwear, our baselayer focuses on keeping you
          comfortable- no matter the weather.
        </p>
      </div>
    </section>
  );
}

function BaselayerExploded() {
  return (
    <section id="baselayerExplosion">
      <div className="simple-container">
        <h2>Exploding the Baselayer</h2>
      </div>
      <div className="bg">
        <div className="simple-container">
          <ul>
            <li>High Fire Resistance</li>
            <li>Filtered Indoor Air</li>
            <li>Regulates Humidity & CO2</li>
            <li>Mold resistant</li>
            <li>Low energy consumption</li>
            <li>Durable & Maintainable</li>
            <li>Reduced Radon Levels</li>
            <li>More...</li>
          </ul>
        </div>
        <div id="carousel-of-parts">
          <div id="insulation">
            <Insulation />
          </div>
          <div id="framing">
            <Framing />
          </div>
          <div id="controlLayers">
            <ControlLayers />
          </div>
          <div id="mechanicals">
            <Mechanicals />
          </div>
        </div>
        <div id="doNotUseSection" className="simple-container">
          <dl id="doNotUseList">
            <dt id="doNotUse">DO NOT USE</dt>
            <dd>
              Spray Foam <span className="newAnnotation">Yucky</span>
            </dd>
            <dd>
              XPS <span className="newAnnotation">use EPS or GPS</span>
            </dd>
            <dd>Natural Gas </dd>
            <dd>
              OSB <span className="newAnnotation">sorry zip</span>
            </dd>
            <dd>PFAS treated membranes </dd>
            <dd>More... </dd>
          </dl>
        </div>
      </div>
    </section>
  );
}

function WhatWeDo() {
  return (
    <section id="whatWeDo">
      <div className="arrow">
        <svg
          viewBox="0 0 199 94"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M125 17.999C122 4.999 167 1.15898 199 0.999005L0 0C22.3333 13.6667 44.8404 27.7765 79 44C113.745 60.5014 148.667 65 174 70L167 94L199 64L177 29V51C166.333 48.6663 130.901 43.5688 125 17.999Z"
            className="svg-midground"
          />
        </svg>
      </div>
      <h2>What We Do</h2>
      <div id="whatWeAre">
        <p>
          We are not a standard builder, we personalize our process to your
          needs.
        </p>
        <button onClick={() => console.log("TODO")} className="baslayer-btn">
          Click Me{" "}
          <div id="theDoingBit">
            <svg
              viewBox="0 0 64 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.77"
                d="M62.7715 8.4823C62.7715 8.4823 47.7693 -8.47072 30.5 8.65625C19.2222 19.8411 1 36.6562 1 36.6562M1 36.6562L15.9909 36.6562C17.7975 36.6562 18.6782 34.4506 17.3684 33.2062L4.3775 20.8649C3.10354 19.6546 1 20.5577 1 22.3149L1 36.6562Z"
                className="svg-red"
              />
            </svg>
            <span className="newAnnotation">
              This is the <span className="underline">doing</span> bit
            </span>
          </div>
        </button>
      </div>
      <div id="theSteps">
        <div id="discovery">
          <h3 className="font-bold">Discovery</h3>
          <div className="bar" />
          <div className="newAnnotation">
            <svg
              width="48"
              height="64"
              viewBox="0 0 48 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.77"
                d="M1.39516 63.825C1.39516 63.825 -1.85015 44.9553 16.0673 28.5076C27.7683 17.7663 46.6259 1.66693 46.6259 1.66693M46.6259 1.66693L31.6462 1.08838C29.8409 1.01866 28.8757 3.18871 30.1365 4.48265L42.6414 17.3162C43.8678 18.5747 46.0046 17.7535 46.0724 15.9976L46.6259 1.66693Z"
                className="svg-red"
              />
            </svg>
            <span>Free! Let’s chat about how the baselayer can help you.</span>
          </div>
        </div>
        <div id="designAndConsult">
          <h3 className="font-bold">Design & Consult</h3>
          <div className="bar" />

          <div className="newAnnotation">
            <svg
              width="24"
              height="78"
              viewBox="0 0 24 78"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.77"
                d="M20.6365 77.5212C20.6365 77.5212 5.69767 65.545 8.20877 41.3529C9.84866 25.5542 13.2946 0.999686 13.2946 0.999686M13.2946 0.999686L1.69585 10.4969C0.298027 11.6414 1.014 13.9059 2.81574 14.0389L20.6857 15.3575C22.4381 15.4868 23.4935 13.4554 22.3803 12.0959L13.2946 0.999686Z"
                className="svg-red"
              />
            </svg>
            <span>We come up with a real good plan.</span>
          </div>
        </div>
        <div id="permitAndBuild">
          <h3 className="font-bold">Permit & Build</h3>
          <div className="bar" />
          <div className="newAnnotation">
            <svg
              width="35"
              height="81"
              viewBox="0 0 35 81"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.77"
                d="M0.999813 80.0015C0.999813 80.0015 16.8218 65.5454 19.3329 41.3533C20.9728 25.5546 24.4187 1.00009 24.4187 1.00009M24.4187 1.00009L12.82 10.4973C11.4221 11.6418 12.1381 13.9063 13.9399 14.0393L31.8098 15.3579C33.5622 15.4872 34.6176 13.4558 33.5044 12.0963L24.4187 1.00009Z"
                className="svg-red"
              />
            </svg>
            <span className="newAnnotation">Finally the buildy part.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FramedBuildingAnnotation() {
  return (
    <span id="framedBuilding">
      <span className="newAnnotation">framed building</span>
      <svg viewBox="0 0 78 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className="svg-red"
          d="M1.00001 45C1.00001 45 29.7628 46.127 47.0321 29C58.3099 17.8152 76.5321 0.999987 76.5321 0.999987M76.5321 0.999987L61.5412 0.999989C59.7346 0.99999 58.8539 3.20567 60.1637 4.44999L73.1546 16.7914C74.4286 18.0016 76.5321 17.0986 76.5321 15.3414L76.5321 0.999987Z"
        />
      </svg>
    </span>
  );
}

function HomeFinishesAnnotation() {
  // return null;
  return (
    <span id="homeFinishes">
      <svg viewBox="0 0 99 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className="svg-red"
          d="M98.0005 8.22865C98.0005 8.22865 50 -8 31.8833 8.22793C20.0521 18.8256 0.999509 34.6938 0.999509 34.6938M0.999509 34.6938L15.9711 35.455C17.7754 35.5468 18.7669 33.3887 17.522 32.0794L5.17454 19.0943C3.96368 17.8209 1.817 18.616 1.72777 20.3709L0.999509 34.6938Z"
        />
      </svg>
      <span className="newAnnotation">home finishes</span>
    </span>
  );
}
