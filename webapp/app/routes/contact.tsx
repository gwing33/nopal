import { Layout } from "../components/Layout";
import { FooterDiscovery } from "../components/Footer";

export default function Contact() {
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4 mt-16">
          <h1 className="purple-light-text text-4xl">Contact</h1>

          <div className="flex gap-8 flex-col sm:flex-row items-start sm:items-center text-xl mt-8">
            <ButtonLink href="https://calendly.com/build-for-good">
              Schedule a Call
            </ButtonLink>
            <ButtonLink href="https://discord.gg/avFGzMNAXu">
              Join us on Discord
            </ButtonLink>
          </div>
          <div className="mt-4">
            <a href="mailto:human@nopal.build" className="link">
              Email us at human@nopal.build
            </a>
          </div>
          <h2 className="purple-light-text text-2xl mt-16">Social Medias</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4">
            <ButtonLink href="https://www.instagram.com/nopal.build/">
              <InstagramLogo /> @nopal.build on Instagram
            </ButtonLink>
            <ButtonLink href="https://www.youtube.com/@nopal-build">
              <YouTubeLogo /> YouTube Channel
            </ButtonLink>
          </div>
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}

function ButtonLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="text-nowrap good-box good-box-hover justify-between inline-flex items-center gap-4 p-2"
      target="_blank"
      href={href}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </a>
  );
}

const InstagramLogo = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 2H8C4.68629 2 2 4.68629 2 8V20C2 23.3137 4.68629 26 8 26H20C23.3137 26 26 23.3137 26 20V8C26 4.68629 23.3137 2 20 2Z"
      stroke="#5DA06D"
      strokeWidth="2.455"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 18.5005C16.4853 18.5005 18.5 16.4858 18.5 14.0005C18.5 11.5152 16.4853 9.50049 14 9.50049C11.5147 9.50049 9.5 11.5152 9.5 14.0005C9.5 16.4858 11.5147 18.5005 14 18.5005Z"
      stroke="#5DA06D"
      strokeWidth="2.455"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.75 7.25V7.251"
      stroke="#5DA06D"
      strokeWidth="2.455"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const YouTubeLogo = () => (
  <svg
    width="28"
    height="22"
    viewBox="0 0 28 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.6667 2H7.33333C4.38781 2 2 4.38781 2 7.33333V15.3333C2 18.2789 4.38781 20.6667 7.33333 20.6667H20.6667C23.6122 20.6667 26 18.2789 26 15.3333V7.33333C26 4.38781 23.6122 2 20.6667 2Z"
      stroke="#5DA06D"
      strokeWidth="2.455"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.333 7.33374L17.9997 11.3337L11.333 15.3337V7.33374Z"
      stroke="#5DA06D"
      strokeWidth="2.455"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
