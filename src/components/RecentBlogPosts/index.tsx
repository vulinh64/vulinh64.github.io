import clsx from "clsx";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const recentPosts = require("../../../.docusaurus/docusaurus-plugin-content-blog/default/blog-post-list-prop-default.json");

const MAX_RECENT_POST: number = 6;

function BlogPostItem({ title, date, permalink }) {
  const formattedDate = date
    ? new Date(date).toISOString().split("T")[0]
    : "Unknown date";

  return (
    <div>
      <Link
        to={permalink}
        className={clsx("text--no-decoration", styles.blogPostItem)}
      >
        <div className={styles.blogPostTitle}>{title}</div>
        {date && (
          <div className={clsx(styles.blogPostDate)}>
            {formattedDate}
          </div>
        )}
      </Link>
    </div>
  );
}

export default function RecentBlogPosts() {
  const items = recentPosts?.items?.filter((item) => !item.unlisted) ?? [];

  if (items.length === 0) {
    return (
      <section className="container margin-vert--lg text--center">
        <Heading as="h1">No blog posts yet 🚧</Heading>
      </section>
    );
  }

  return (
    <section className="container margin-vert--lg">
      <div className="row">
        <div className="col col--12">
          <Heading as="h1" className="margin-bottom--lg text--center">
            Recent Blog Posts
          </Heading>
        </div>
      </div>
      <div className="row">
        <div className="col col--8 col--offset-3">
          {items.slice(0, MAX_RECENT_POST).map(({ title, date, permalink }, index) => (
            <BlogPostItem
              key={index}
              title={title}
              date={date}
              permalink={permalink}
            />
          ))}
        </div>
      </div>
      <div className="text--center margin-top--lg">
        <Link
          to="/blog"
          className="button button--outline button--primary button--lg"
        >
          View All Posts
        </Link>
      </div>
    </section>
  );
}