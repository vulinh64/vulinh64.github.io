import React from 'react';
import clsx from 'clsx';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';
import CustomBlogThumbnail from "../../components/CustomBlogThumbnail";
import {DiscussionEmbed} from 'disqus-react';

// apply a bottom margin in list view
function useContainerClassName() {
    const {isBlogPostPage} = useBlogPost();
    return !isBlogPostPage ? 'margin-bottom--xl' : undefined;
}

export default function BlogPostItem({children, className}) {
    const containerClassName = useContainerClassName();
    const frontMatter = useBlogPost().metadata.frontMatter;

    const {slug, title} = frontMatter;
    const {comment = true} = frontMatter;

    return (
        <BlogPostItemContainer className={clsx(containerClassName, className)}>
            <BlogPostItemHeader/>
            <BlogPostItemContent>
                {!containerClassName && <CustomBlogThumbnail filename={frontMatter.thumbnail}/>}
                {children}
            </BlogPostItemContent>
            <BlogPostItemFooter/>

            <hr />

            {comment && <DiscussionEmbed
                shortname='vulinhjava'
                config={{
                    url: slug,
                    identifier: slug,
                    title: title,
                    language: 'en_US',
                }}/>}
        </BlogPostItemContainer>
    );
}
