import { db, pgClient } from "../src/db/client";
import { publications } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const rows = await db.select().from(publications);
  console.log(`Checking ${rows.length} publications in DB...`);

  let updatedCount = 0;
  for (const row of rows) {
    let needsUpdate = false;
    let newContent = row.content;
    let newExcerpt = row.excerpt;
    let newEventLocation = row.eventLocation;

    if (newContent && (newContent.includes("17.15") || newContent.includes("17:15"))) {
      newContent = newContent.replace(/17[.:]15/g, "17.00");
      needsUpdate = true;
    }

    if (newExcerpt && (newExcerpt.includes("17.15") || newExcerpt.includes("17:15"))) {
      newExcerpt = newExcerpt.replace(/17[.:]15/g, "17.00");
      needsUpdate = true;
    }

    if (
      newEventLocation &&
      (newEventLocation.includes("17.15") || newEventLocation.includes("17:15"))
    ) {
      newEventLocation = newEventLocation.replace(/17[.:]15/g, "17.00");
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(`Updating publication "${row.slug}" (ID: ${row.id})...`);
      console.log(`Old eventLocation: ${row.eventLocation} -> New: ${newEventLocation}`);
      console.log(`Content updated: ${newContent !== row.content}`);
      await db
        .update(publications)
        .set({
          content: newContent,
          excerpt: newExcerpt,
          eventLocation: newEventLocation,
          updatedAt: new Date(),
        })
        .where(eq(publications.id, row.id));
      updatedCount++;
    }
  }

  console.log(`Finished. Updated ${updatedCount} publication(s).`);
  await pgClient.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Error running fix script:", err);
  await pgClient.end();
  process.exit(1);
});
