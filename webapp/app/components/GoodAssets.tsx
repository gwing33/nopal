import { Link } from "@remix-run/react";

export function GoodBuildingLink() {
  return (
    <Link className="good-box" to="/good/building">
      <svg
        width="66"
        height="57"
        viewBox="0 0 66 57"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.78947 39.3703C2.78947 43.4471 2.01736 52.2389 2.01736 54.967C9.42965 54.967 20.074 54.8129 28.4237 54.1949C32.6524 53.8819 51.9989 55.2244 61.9334 54.967C62.2937 54.1949 62.1187 52.3109 62.2422 50.952C62.3967 49.2534 62.3967 30.5685 63.1688 26.7079C63.9409 22.8474 63.1688 21.9205 63.1688 19.4498C62.2422 18.6777 56.8374 16.0525 55.7565 15.4348C54.6755 14.8171 47.9839 10.9324 45.8734 9.56671C40.623 6.16941 36.4536 3.90455 32.5931 2C28.4237 4.05897 22.8644 7.55922 19.3127 9.56671C17.9286 10.349 5.10582 16.6702 2.01736 19.4498C1.86294 22.6926 2.78947 34.2744 2.78947 39.3703Z"
          fill="#8D8EB4"
          stroke="#3F2B46"
          strokeWidth="3"
        />
        <path
          d="M24.237 38.5982C24.6076 40.4513 25.0091 49.6652 25.1635 54.0405C29.23 54.5552 38.5365 55.1372 38.9071 54.8901C39.3704 54.5813 38.9071 45.8561 38.9071 44.1574V30.7227C38.0835 30.98 34.2557 32.0916 31.186 32.4213C28.1879 32.7433 26.1415 32.7302 23.4648 32.4213C23.5678 33.7082 23.8663 36.7451 24.237 38.5982Z"
          fill="#86CB97"
          stroke="#3F2B46"
          strokeWidth="3"
        />
        <circle cx="26.3992" cy="37.054" r="0.926537" fill="#3F2B46" />
        <circle cx="27.325" cy="50.7976" r="0.926537" fill="#3F2B46" />
      </svg>
      <span>
        <span className="title">Good Building</span>
        <br />
        <span className="desc">
          Healthy & Efficient.
          <br />
          Custom or Ready to Build.
        </span>
      </span>
      <GoodArrow />
    </Link>
  );
}

export function GoodConsultingLink() {
  return (
    <Link className="good-box" to="/good/consulting">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M36.6836 52.9745C34.4558 50.8952 30 44.865 30 37.3793C30 28.0222 32.8962 24.6804 36.6836 24.6804C39.1714 24.3462 44.4812 23.9229 45.818 24.0121C47.4889 24.1234 54.8409 29.5818 54.8409 40.2756C54.8409 48.1325 51.2706 51.7051 49.0484 52.7536L62.5271 59.4355C61.6359 60.2153 60.8056 60.3579 59.6308 60.7722C58.4468 61.1898 57.6367 60.9942 56.5118 61.552C55.6465 61.9811 54.85 62.6781 54.5067 63L40.2483 54.9796L38.6742 54.0942C38.0642 53.8501 37.4022 53.4828 36.6836 52.9745Z"
          fill="#6D6E99"
        />
        <path
          d="M36.6836 52.9745C34.4558 50.8952 30 44.865 30 37.3793C30 28.0222 32.8962 24.6804 36.6836 24.6804M36.6836 52.9745C45.818 59.4354 45.818 43.1273 45.818 40.2756C45.818 36.711 41.1394 24.6804 36.6836 24.6804M36.6836 52.9745L40.2483 54.9796M36.6836 24.6804C39.1714 24.3462 44.4812 23.9229 45.818 24.0121C47.4889 24.1234 54.8409 29.5818 54.8409 40.2756C54.8409 48.1325 51.2706 51.7051 49.0484 52.7536M40.2483 54.9796L54.5067 63C54.85 62.6781 55.6465 61.9811 56.5118 61.552C57.6367 60.9942 58.4468 61.1898 59.6308 60.7722C60.8056 60.3579 61.6359 60.2153 62.5271 59.4355L49.0484 52.7536M40.2483 54.9796L48.4914 52.9745C48.6641 52.92 48.8509 52.8467 49.0484 52.7536"
          stroke="#3F2B46"
        />
        <path
          d="M39.8027 54.7569L54.7295 63.0001C55.0729 62.6782 55.8693 61.9811 56.7346 61.5521C57.8595 60.9943 58.6696 61.1899 59.8537 60.7723C61.0285 60.358 61.8588 60.2153 62.7499 59.4356L49.2712 52.7537C49.0738 52.8468 48.887 52.9201 48.7143 52.9746L39.8027 54.7569Z"
          fill="#8D8EB4"
          stroke="#3F2B46"
        />
        <path
          d="M36.6836 52.9748C34.4558 50.8954 30 44.8653 30 37.3796C30 28.0225 32.8962 24.6807 36.6836 24.6807C41.1394 24.6807 45.818 36.7112 45.818 40.2758C45.818 42.9032 45.818 56.9531 38.6742 54.0944C38.0642 53.8504 37.4022 53.483 36.6836 52.9748Z"
          fill="#3F2B46"
        />
        <path
          d="M36.6836 52.9748C34.4558 50.8954 30 44.8653 30 37.3796C30 28.0225 32.8962 24.6807 36.6836 24.6807C41.1394 24.6807 45.818 36.7112 45.818 40.2758C45.818 43.1275 45.818 59.4356 36.6836 52.9748ZM36.6836 52.9748L40.2483 54.9799"
          stroke="#3F2B46"
        />
        <path
          d="M38.4039 33.9007C39.3874 34.8551 41.3359 37.6031 41.2624 40.9598C41.1705 45.1558 39.8327 46.6257 38.1261 46.5883C36.1183 46.5444 34.1283 41.1035 34.1633 39.505C34.1891 38.3268 34.3271 32.0265 37.518 33.3789C37.7904 33.4944 38.0851 33.6657 38.4039 33.9007Z"
          fill="#8D8EB4"
        />
        <path
          d="M38.4039 33.9007C39.3874 34.8551 41.3359 37.6031 41.2624 40.9598C41.1705 45.1558 39.8327 46.6257 38.1261 46.5883C36.1183 46.5444 34.1283 41.1035 34.1633 39.505C34.1913 38.2262 34.3515 30.9133 38.4039 33.9007ZM38.4039 33.9007L36.8174 32.9664"
          stroke="#3F2B46"
        />
        <path
          d="M19.9395 60.9216V4.33605C19.9395 4.33605 23.451 4.07432 25.6794 4.33605C26.7903 25.2568 24.5684 36.813 25.6794 60.9216C23.451 61.1833 19.9395 60.9216 19.9395 60.9216Z"
          fill="#FFEAA4"
          stroke="#3F2B46"
        />
        <path
          d="M19.9395 4.33599V60.9215C19.9395 60.9215 16.4279 61.1833 14.1996 60.9215C13.0886 40.0008 15.3105 28.4446 14.1996 4.33599C16.4279 4.07425 19.9395 4.33599 19.9395 4.33599Z"
          fill="#FFF9F1"
          stroke="#3F2B46"
        />
        <path
          d="M1 1L14.0682 4.40909H19.75L7.25 1.37879L1 1Z"
          fill="#FFF9F1"
          stroke="#3F2B46"
        />
        <path
          d="M7.06055 1.37891L20.1287 4.40921H25.8105L13.3105 1.37891H7.06055Z"
          fill="#FFEAA4"
          stroke="#3F2B46"
        />
        <path
          d="M1.75763 56.8712L1.18945 1.09473C1.18945 1.09473 9.2387 2.98867 14.1629 4.59851C15.1099 11.1326 14.3523 60.9432 14.3523 60.9432L1.75763 56.8712Z"
          fill="#FFF9F1"
          stroke="#3F2B46"
        />
      </svg>
      <span>
        <span className="title">Good Consulting</span>
        <br />
        <span className="desc">
          Optimize your building
          <br />
          with better materials.
        </span>
      </span>
      <GoodArrow />
    </Link>
  );
}

export function GoodArchitectureLink() {
  return (
    <Link className="good-box" to="/good/architecture">
      <svg
        width="74"
        height="65"
        viewBox="0 0 74 65"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.31526 52.7379C2.31526 55.4146 2.00693 61.1871 2.00693 62.9783C4.96691 62.9783 9.21754 62.8771 12.5518 62.4714C14.2405 62.2659 21.9662 63.1473 25.9334 62.9783C26.0773 62.4714 26.0074 61.2344 26.0567 60.3422C26.1184 59.2269 26.1184 46.9588 26.4267 44.424C26.7351 41.8893 26.4267 15.0794 26.4267 13.4571C26.0567 12.9502 23.8984 11.2265 23.4667 10.821C23.0351 10.4154 20.3629 7.86479 19.5201 6.96814C17.4235 4.73755 15.7585 3.25048 14.2168 2C12.5518 3.35188 10.3319 5.65006 8.91354 6.96814C8.36083 7.48179 3.24026 11.6321 2.00693 13.4571C1.94527 15.5863 2.31526 49.392 2.31526 52.7379Z"
          fill="#BA675D"
          stroke="#3F2B46"
          strokeWidth="3"
        />
        <path
          d="M10.0499 52.231C10.2933 53.4477 10.5569 59.4973 10.6583 62.37C13.3282 62.708 19.4387 63.0901 19.682 62.9279C19.9862 62.7251 19.682 56.9963 19.682 55.881V47.0601C19.1413 47.229 16.628 47.9589 14.6125 48.1754C12.644 48.3868 11.3004 48.3781 9.54297 48.1754C9.61056 49.0203 9.80658 51.0143 10.0499 52.231Z"
          fill="#F6C8C3"
          stroke="#3F2B46"
          strokeWidth="3"
        />
        <circle cx="18.0195" cy="51.217" r="0.608344" fill="#3F2B46" />
        <circle cx="18.6279" cy="60.2409" r="0.608344" fill="#3F2B46" />
        <path
          d="M25.242 52.7379C25.242 55.4146 24.9337 61.1871 24.9337 62.9783C27.8937 62.9783 32.1443 62.8771 35.4786 62.4714C37.1673 62.2659 44.893 63.1473 48.8601 62.9783C49.004 62.4714 48.9342 61.2344 48.9835 60.3422C49.0451 59.2269 49.0451 46.9588 49.3535 44.424C49.6618 41.8893 49.3535 15.0794 49.3535 13.4571C48.9835 12.9502 46.8252 11.2265 46.3935 10.821C45.9618 10.4154 43.2897 7.86479 42.4469 6.96814C40.3502 4.73755 38.6852 3.25048 37.1436 2C35.4786 3.35188 33.2586 5.65006 31.8403 6.96814C31.2876 7.48179 26.167 11.6321 24.9337 13.4571C24.872 15.5863 25.242 49.392 25.242 52.7379Z"
          fill="#BA675D"
          stroke="#3F2B46"
          strokeWidth="3"
        />
        <path
          d="M32.9767 52.231C33.22 53.4477 33.4836 59.4973 33.585 62.37C36.255 62.708 42.3655 63.0901 42.6088 62.9279C42.913 62.7251 42.6088 56.9963 42.6088 55.881V47.0601C42.068 47.229 39.5548 47.9589 37.5393 48.1754C35.5708 48.3868 34.2272 48.3781 32.4697 48.1754C32.5373 49.0203 32.7333 51.0143 32.9767 52.231Z"
          fill="#F6C8C3"
          stroke="#3F2B46"
          strokeWidth="3"
        />
        <circle cx="40.9462" cy="51.217" r="0.608344" fill="#3F2B46" />
        <circle cx="41.5546" cy="60.2409" r="0.608344" fill="#3F2B46" />
        <path
          d="M48.1678 52.7379C48.1678 55.4146 47.8595 61.1871 47.8595 62.9783C50.8194 62.9783 55.0701 62.8771 58.4044 62.4714C60.0931 62.2659 67.8187 63.1473 71.7859 62.9783C71.9298 62.4714 71.8599 61.2344 71.9093 60.3422C71.9709 59.2269 71.9709 46.9588 72.2793 44.424C72.5876 41.8893 72.2793 15.0794 72.2793 13.4571C71.9093 12.9502 69.7509 11.2265 69.3193 10.821C68.8876 10.4154 66.2155 7.86479 65.3727 6.96814C63.276 4.73755 61.611 3.25048 60.0694 2C58.4044 3.35188 56.1844 5.65006 54.7661 6.96814C54.2134 7.48179 49.0928 11.6321 47.8595 13.4571C47.7978 15.5863 48.1678 49.392 48.1678 52.7379Z"
          fill="#BA675D"
          stroke="#3F2B46"
          strokeWidth="3"
        />
        <path
          d="M55.9025 52.231C56.1458 53.4477 56.4094 59.4973 56.5108 62.37C59.1808 62.708 65.2912 63.0901 65.5346 62.9279C65.8387 62.7251 65.5346 56.9963 65.5346 55.881V47.0601C64.9938 47.229 62.4806 47.9589 60.465 48.1754C58.4966 48.3868 57.1529 48.3781 55.3955 48.1754C55.4631 49.0203 55.6591 51.0143 55.9025 52.231Z"
          fill="#F6C8C3"
          stroke="#3F2B46"
          strokeWidth="3"
        />
        <circle cx="63.872" cy="51.217" r="0.608344" fill="#3F2B46" />
        <circle cx="64.4804" cy="60.2409" r="0.608344" fill="#3F2B46" />
      </svg>

      <span>
        <span className="title">Good Architecture</span>
        <br />
        <span className="desc">
          Human experience <br />
          matters.
        </span>
      </span>
      <GoodArrow />
    </Link>
  );
}

const GoodArrow = () => (
  <span className="good-arrow">
    <svg
      width="26"
      height="12"
      viewBox="0 0 26 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24.4669 6.03131L19.7612 1.32566C18.4837 0.0481781 16.3013 0.985101 16.3477 2.79114L16.5122 9.20944C16.5573 10.9661 18.6833 11.8149 19.9258 10.5724L24.4669 6.03131ZM24.4669 6.03131C24.4669 6.03131 5.92127 6.07126 0.408142 6.03131"
        stroke="#7F5B8B"
      />
    </svg>
  </span>
);
