import React from 'react';
import clsx from 'clsx';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';
import CustomBlogThumbnail from "../../components/CustomBlogThumbnail";
import {DiscussionEmbed} from 'disqus-react';
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

// apply a bottom margin in list view
function useContainerClassName() {
    const {isBlogPostPage} = useBlogPost();
    return !isBlogPostPage ? 'margin-bottom--xl' : undefined;
}

export default function BlogPostItem({children, className}) {
    const containerClassName = useContainerClassName();
    const frontMatter = useBlogPost().metadata.frontMatter;

    const slug = frontMatter.slug;
    const fullUrl = `${useDocusaurusContext().siteConfig.url}/blog/${slug}`;

    return (
        <BlogPostItemContainer className={clsx(containerClassName, className)}>
            <BlogPostItemHeader/>
            <BlogPostItemContent>
                {!containerClassName && <CustomBlogThumbnail filename={frontMatter.thumbnail}/>}
                {children}
            </BlogPostItemContent>
            <BlogPostItemFooter/>

            <hr/>

            {(frontMatter.comment ?? true) && <DiscussionEmbed
                shortname='vulinhjava'
                config={{
                    url: fullUrl,
                    identifier: slug,
                    title: frontMatter.title,
                }}/>}
        </BlogPostItemContainer>
    );
}
