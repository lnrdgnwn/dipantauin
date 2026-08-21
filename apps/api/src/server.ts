import app from "./app";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/docs`);
});