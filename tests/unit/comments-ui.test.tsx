jest.mock("../../app/articles/comment-actions", () => ({
  addCommentAction: async () => ({ ok: true, error: null }),
}));

import { ArticleComments } from "@/components/articles/ArticleComments";
import type { CommentWithAuthor } from "@/lib/comments/queries";
import { render, screen } from "@testing-library/react";

const baseComment = (overrides: Partial<CommentWithAuthor>): CommentWithAuthor => ({
  id: "c1",
  body: "Hello thread",
  created_at: new Date().toISOString(),
  user_id: "u1",
  username: "commenter",
  ...overrides,
});

describe("ArticleComments", () => {
  it("renders comment usernames from profile data", () => {
    const comments = [baseComment({ username: "dana" })];
    render(
      <ArticleComments
        postId="p1"
        postSlug="my-post"
        comments={comments}
        canComment={false}
        loginNextPath="/login?next=/articles/my-post"
      />,
    );
    expect(screen.getByTestId("comment-author-name")).toHaveTextContent("dana");
  });

  it("falls back to 'User' when username is missing — never shows email", () => {
    const comments = [baseComment({ username: null })];
    render(
      <ArticleComments
        postId="p1"
        postSlug="my-post"
        comments={comments}
        canComment={false}
        loginNextPath="/login"
      />,
    );
    expect(screen.getByTestId("comment-author-name")).toHaveTextContent("User");
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it("shows guest CTA instead of the composer when cannot comment", () => {
    render(
      <ArticleComments
        postId="p1"
        postSlug="x"
        comments={[]}
        canComment={false}
        loginNextPath="/login?next=/articles/x"
      />,
    );
    expect(screen.getByTestId("comment-guest-prompt")).toBeInTheDocument();
    expect(screen.queryByTestId("comment-form")).not.toBeInTheDocument();
  });

  it("shows the composer when the user can comment", () => {
    render(
      <ArticleComments
        postId="p1"
        postSlug="x"
        comments={[]}
        canComment
        loginNextPath="/login"
      />,
    );
    expect(screen.getByTestId("comment-form")).toBeInTheDocument();
    expect(screen.queryByTestId("comment-guest-prompt")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
  });
});
