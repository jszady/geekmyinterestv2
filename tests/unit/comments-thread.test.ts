import {
  buildCommentThreads,
  type CommentWithAuthor,
} from "@/lib/comments/comment-thread";

function c(partial: Partial<CommentWithAuthor>): CommentWithAuthor {
  return {
    id: "id",
    body: "",
    created_at: "2020-01-01T00:00:00.000Z",
    user_id: "u",
    username: "a",
    avatar_url: null,
    parent_comment_id: null,
    ...partial,
  };
}

describe("buildCommentThreads", () => {
  it("nests replies under parents in created order", () => {
    const flat = [
      c({ id: "1", body: "root", parent_comment_id: null, created_at: "2020-01-01T00:00:00.000Z" }),
      c({
        id: "2",
        body: "r1",
        parent_comment_id: "1",
        created_at: "2020-01-01T00:00:01.000Z",
      }),
      c({
        id: "3",
        body: "r2",
        parent_comment_id: "1",
        created_at: "2020-01-01T00:00:02.000Z",
      }),
    ];
    const tree = buildCommentThreads(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].body).toBe("root");
    expect(tree[0].replies.map((x) => x.body)).toEqual(["r1", "r2"]);
  });

  it("does not duplicate replies in roots", () => {
    const flat = [
      c({ id: "p", parent_comment_id: null }),
      c({ id: "r", parent_comment_id: "p" }),
    ];
    const tree = buildCommentThreads(flat);
    expect(tree.map((n) => n.id)).toEqual(["p"]);
    expect(tree[0].replies.map((n) => n.id)).toEqual(["r"]);
  });

  it("treats missing parent as root (orphan)", () => {
    const flat = [c({ id: "o", parent_comment_id: "missing" })];
    const tree = buildCommentThreads(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("o");
    expect(tree[0].replies).toHaveLength(0);
  });

  it("supports reply chains", () => {
    const flat = [
      c({ id: "a", parent_comment_id: null, created_at: "2020-01-01T00:00:00.000Z" }),
      c({
        id: "b",
        parent_comment_id: "a",
        created_at: "2020-01-01T00:00:01.000Z",
      }),
      c({
        id: "c",
        parent_comment_id: "b",
        created_at: "2020-01-01T00:00:02.000Z",
      }),
    ];
    const tree = buildCommentThreads(flat);
    expect(tree[0].replies).toHaveLength(1);
    expect(tree[0].replies[0].id).toBe("b");
    expect(tree[0].replies[0].replies).toHaveLength(1);
    expect(tree[0].replies[0].replies[0].id).toBe("c");
  });
});
