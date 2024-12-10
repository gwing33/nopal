import pad from "../images/pad.svg";
import { ReactNode } from "react";

function ContactUsLinks() {
  return (
    <div className="flex gap-4 items-center">
      <a
        href="https://discord.gg/avFGzMNAXu"
        target="_blank"
        className="btn-secondary"
      >
        Join our Discord
      </a>
      <a href="mailto:human@nopal.build" className="p-4 pt-2 pb-2">
        Email us
      </a>
    </div>
  );
}

export function Footer({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="scene0">
      <div className="scene0-bg" />
      <div className="scene0-shadow-bg" />
      <div className="scene0-pricklyPearFruit" />
      <div className="flex items-center justify-center h-full md:justify-end md:items-start">
        <div className="scene0-content flex items-end justify-center flex-col p-10 lg:p-20">
          <h2 className="text-2xl">{title}</h2>
          <p className="text-base max-w-96 mt-4 mb-4 text-right">{children}</p>
          <ContactUsLinks />
        </div>
      </div>
      <div className="footer flex gap-2 p-8 pt-4 pb-4">
        <img src={pad} alt="nopal" />
        <img src={pad} alt="nopal" />
        <img src={pad} alt="nopal" />
      </div>
    </div>
  );
}
