import React, {type ReactNode} from 'react';
import {BlogPostProvider} from '@docusaurus/plugin-content-blog/client';
import BlogPostItem from '@theme/BlogPostItem';
import type {Props} from '@theme/BlogPostItems';
import CustomBlogThumbnail from "../../components/CustomBlogThumbnail";

export default function BlogPostItems({
                                          items,
                                          component: BlogPostItemComponent = BlogPostItem,
                                      }: Readonly<Props>): ReactNode {
    return (
        <>
            {items.map(({content: BlogPostContent}) => {
                const {frontMatter} = BlogPostContent.metadata;

                return (
                    <BlogPostProvider
                        key={BlogPostContent.metadata.permalink}
                        content={BlogPostContent}>
                        <BlogPostItemComponent>
                            <div className={"margin-bottom--lg"}>
                                <CustomBlogThumbnail filename={frontMatter.thumbnail}/>
                            </div>
                            <BlogPostContent/>
                        </BlogPostItemComponent>
                    </BlogPostProvider>
                );
            })}
        </>
    );
}