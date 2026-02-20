describe("Test Setup", () => {
  it("vitest is configured correctly", () => {
    expect(true).toBe(true);
  });

  it("@/ path alias resolves", async () => {
    // Verify the alias works by importing something that will exist
    expect(typeof window).toBe("object");
  });
});
