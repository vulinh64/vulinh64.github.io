import React, {ReactNode} from "react";
import clsx from "clsx";
import {useBlogPost} from "@docusaurus/plugin-content-blog/client";
import BlogPostItemContainer from "@theme/BlogPostItem/Container";
import BlogPostItemHeader from "@theme/BlogPostItem/Header";
import BlogPostItemContent from "@theme/BlogPostItem/Content";
import BlogPostItemFooter from "@theme/BlogPostItem/Footer";
import CustomBlogThumbnail from "../../components/CustomBlogThumbnail";
import {DiscussionEmbed} from "disqus-react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

// apply a bottom margin in list view
function useContainerClassName(): string | undefined {
    const {isBlogPostPage} = useBlogPost();
    return !isBlogPostPage ? "margin-bottom--xl" : undefined;
}

interface BlogPostItemProps {
    children: ReactNode;
    className?: string;
}

export default function BlogPostItem({children, className}: BlogPostItemProps) {
    const containerClassName = useContainerClassName();

    const {
        metadata: {
            frontMatter: {slug, title, comment, thumbnail},
        },
    } = useBlogPost();

    const {
        siteConfig: {url},
    } = useDocusaurusContext();

    const fullUrl = `${url}/blog/${slug}`;

    return (
        <BlogPostItemContainer className={clsx(containerClassName, className)}>
            <BlogPostItemHeader/>
            <BlogPostItemContent>
                {!containerClassName &&
                    <div className={"margin-bottom--lg"}>
                        <CustomBlogThumbnail filename={thumbnail}/>
                    </div>}
                {children}
            </BlogPostItemContent>
            <BlogPostItemFooter/>

            {!containerClassName && (comment ?? true) && (
                <div>
                    <hr/>
                    <DiscussionEmbed
                        shortname="vulinhjava"
                        config={{
                            url: fullUrl,
                            identifier: slug,
                            title: title,
                        }}
                    />
                </div>
            )}
        </BlogPostItemContainer>
    );
}
