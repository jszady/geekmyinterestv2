jest.mock("../../app/articles/comment-actions", () => ({
  addCommentAction: async () => ({ ok: true, error: null }),
  deleteCommentAction: async () => ({ ok: true, error: null }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

import { ArticleComments } from "@/components/articles/ArticleComments";
import type { CommentWithAuthor } from "@/lib/comments/comment-thread";
import { render, screen } from "@testing-library/react";

const baseComment = (overrides: Partial<CommentWithAuthor>): CommentWithAuthor => ({
  id: "c1",
  body: "Hello thread",
  created_at: new Date().toISOString(),
  user_id: "u1",
  username: "commenter",
  avatar_url: null,
  parent_comment_id: null,
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
    expect(screen.getAllByTestId("comment-author-name")[0]).toHaveTextContent("dana");
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
    expect(screen.getAllByTestId("comment-author-name")[0]).toHaveTextContent("User");
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

  it("nests replies under the parent and shows Reply for logged-in users", () => {
    const comments: CommentWithAuthor[] = [
      baseComment({
        id: "root",
        body: "Top",
        username: "alice",
        created_at: "2024-06-01T12:00:00.000Z",
      }),
      baseComment({
        id: "rep",
        body: "Nested reply",
        username: "bob",
        parent_comment_id: "root",
        created_at: "2024-06-01T13:00:00.000Z",
      }),
    ];
    render(
      <ArticleComments
        postId="p1"
        postSlug="x"
        comments={comments}
        canComment
        loginNextPath="/login"
      />,
    );
    expect(screen.getByText("Top")).toBeInTheDocument();
    expect(screen.getByText("Nested reply")).toBeInTheDocument();
    expect(screen.getAllByTestId("comment-reply-toggle")).toHaveLength(2);
  });

  it("shows log in to reply link for guests on each comment", () => {
    const comments: CommentWithAuthor[] = [
      baseComment({ id: "a", body: "Hi" }),
      baseComment({ id: "b", body: "Yo", parent_comment_id: "a" }),
    ];
    render(
      <ArticleComments
        postId="p1"
        postSlug="/articles/x"
        comments={comments}
        canComment={false}
        loginNextPath="/login?next=/articles/x"
      />,
    );
    const links = screen.getAllByTestId("comment-reply-login");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/login?next=/articles/x");
  });
});
