import { ServerTypes } from "@/types/player-types";

export const initialServers: ServerTypes[] = [
  {
    name: "Icarus I",
    server: "icarus",
    status: "queue",
    desc: "Download & Multi Audio Support",
  },
  {
    name: "Atlas II",
    server: "atlas_v2",
    status: "queue",
    desc: "4K Support & Multi Audio",
  },

  {
    name: "Orion III",
    server: "orion",
    status: "queue",
    desc: "Built-In Subtitle",
  },
  {
    name: "Zeus IV",
    server: "zeus",
    status: "queue",
    desc: "Alternative",
  },
  {
    name: "Daedalus V",
    server: "daedalus",
    status: "queue",
    desc: "Alternative",
  },
  {
    name: "Athena VI",
    server: "athena",
    status: "queue",
    desc: "Main Server & Multi Audio Support",
  },

  // {
  //   name: "Daedalus V",
  //   server: "daedalus",
  //   status: "queue",
  //   desc: "Multi Audio Support",
  // },

  // {
  //   name: "Talos VII",
  //   server: "talos",
  //   status: "queue",
  //   desc: "Spanish Audio",
  // },
];
