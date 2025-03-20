import { Layout } from "../components/Layout";
import {
  GoodBuildingLink,
  GoodConsultingLink,
  GoodArchitectureLink,
} from "../components/GoodAssets";

export default function Goods() {
  return (
    <Layout>
      <div className="good-menu">
        <div className="flex justify-center">
          <ul
            style={{
              border: "0",
              flexDirection: "column",
            }}
          >
            <li>
              <GoodBuildingLink />
            </li>
            <li>
              <GoodConsultingLink />
            </li>
            <li>
              <GoodArchitectureLink />
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
