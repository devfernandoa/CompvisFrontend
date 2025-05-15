/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./src/styles/**/*.{css}" // ← Make sure this line exists!
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
