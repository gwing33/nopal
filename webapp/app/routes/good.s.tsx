import { Layout } from "../components/Layout";
import {
  GoodBuildingLink,
  GoodGuidingLink,
  GoodArchitectureLink,
} from "../components/GoodAssets";

export default function Goods() {
  return (
    <Layout>
      <div className="flex justify-center">
        <div className="good-menu">
          <div className="flex justify-center">
            <ul
              style={{
                border: "0",
                flexDirection: "column",
              }}
            >
              <li>
                <GoodArchitectureLink />
              </li>
              <li>
                <GoodBuildingLink />
              </li>
              <li>
                <GoodGuidingLink />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
