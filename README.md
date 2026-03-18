# Delhi Digital Twin Carbon Dashboard

A high-performance Digital Twin visualization dashboard built with **Next.js 15**, **Tailwind CSS**, and **Supabase**. It leverages **Mapbox GL 3D** extrusions to dynamically model real-time Carbon Dioxide (CO2) equivalents and Air Quality Index (AQI) levels across different wards in Delhi, India.

## Features

- **Live 3D Map Layer:** View Delhi landmarks (Connaught Place, Red Fort) and ward-level data interactively with color-coded heatmap polygons (Emerald to Crimson) extruded physically into 3D space based on real-time CO2 volumes.
- **Dynamic Haze & Atmosphere:** The map's background fog and star intensity naturally fluctuate based on the aggregated City Health Score, offering a visceral representation of smog vs. clear skies.
- **AI Policy Simulator:** An interactive sandbox allowing "What-If" modifications to key city parameters ("Green Transport Adoption", "Industrial Filter Efficiency"). Watch in real-time as the sliders artificially decay or inflate local ward emissions and update the global health score.
- **Sector Breakdown Dashboard:** Beautiful, modern, and responsive analytical graphs using Recharts.
- **PDF Report Generation:** Click a single button to capture and download the current state of your simulations to a local PDF file.
- **Supabase Integration:** Pre-configured to hook into live Postgres edge functions for reading real remote IoT sensor emissions.

## How It Works: The AI Proxy Model

The core logic of this Digital Twin relies on a **Proxy AI Simulation Model** running within the client context (`SimulatorContext`).

1. **Baseline Ingestion:** The engine requests raw baseline data (via Supabase or mock fallbacks) representing the current factual state of emissions across various wards.
2. **Context Subscriptions:** Rather than statically painting this data, Mapbox components subscribe to the global `SimulatorProvider`.
3. **Weight Overrides:** When users adjust the "Green Transport" slider, for example, the state applies a reduction weight (e.g., `0.33` for 67% adoption) directly against any sector data flagged as 'Transport'. This is instantaneously mapped over the base GeoJSON collection via the `applySimulation` algorithm.
4. **Instanced Repainting:** The mutated GeoJSON object is fed back into the `setData()` Mapbox buffer causing fluid 3D geometric transformations and triggering dynamic fog recalculations based on the rolled-up algorithmic score.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Configure your Environment Variables (`.env.local`):

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the outcome.
