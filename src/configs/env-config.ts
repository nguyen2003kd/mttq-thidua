



// These values run in the browser and only protect persisted UI state from
// casual inspection. They must never be treated as server-side secrets.
const envConfig = {
  BUFFER_KEY:
    import.meta.env.BUFFER_KEY?.trim() ||
    import.meta.env.VITE_MINO_BUFFER?.trim() ||
    import.meta.env.NEXT_PUBLIC_MINO_BUFFER?.trim() ,
  SECRET_KEY:
    import.meta.env.SECRET_KEY?.trim() ||
    import.meta.env.VITE_MINO_SECRET?.trim() ||
    import.meta.env.NEXT_PUBLIC_MINO_SECRET?.trim() ,
};

export { envConfig };
export default envConfig;
