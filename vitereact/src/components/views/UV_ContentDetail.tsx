import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { contentSchema, commentSchema, Content, Comment } from '@/zodschemas';
import { z } from 'zod';

const fetchContentDetails = async (content_id: string, auth_token: string | null) => {
  if (!auth_token) throw new Error('Unauthorized');
  const response = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/content/${content_id}`,
    {
      headers: {
        Authorization: `Bearer ${auth_token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return contentSchema.parse(response.data);
};

const fetchComments = async (content_id: string, auth_token: string | null) => {
  if (!auth_token) throw new Error('Unauthorized');
  const response = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/comments?content_id=${content_id}`,
    {
      headers: {
        Authorization: `Bearer ${auth_token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return z.array(commentSchema).parse(response.data);
};

const likeContent = async (content_id: string, auth_token: string | null) => {
  if (!auth_token) throw new Error('Unauthorized');
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/content/${content_id}/likes`,
    {},
    {
      headers: {
        Authorization: `Bearer ${auth_token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

const UV_ContentDetail: React.FC = () => {
  const { content_id } = useParams<{ content_id: string }>();
  const auth_token = useAppStore(state => state.authentication_state.auth_token);

  const { data: content, error: contentError, isLoading: isContentLoading } = useQuery<Content, Error>(
    ['content', content_id], 
    () => fetchContentDetails(content_id!, auth_token), 
    { enabled: !!content_id && !!auth_token }
  );

  const { data: comments, error: commentsError, isLoading: isCommentsLoading } = useQuery<Comment[], Error>(
    ['comments', content_id], 
    () => fetchComments(content_id!, auth_token),
    { enabled: !!content_id && !!auth_token }
  );

  const { mutate: like, isLoading: isLikeLoading } = useMutation(
    () => likeContent(content_id!, auth_token),
    {
      onSuccess: () => {
        // Optionally refetch content or update local state with new like count
      },
    }
  );

  if (isContentLoading || isCommentsLoading) {
    return <div>Loading...</div>;
  }

  if (contentError || commentsError) {
    return <div>Error: {contentError?.message || commentsError?.message}</div>;
  }

  return (
    <>
      {content && (
        <div className="max-w-2xl mx-auto my-8 p-4 bg-white border border-gray-200 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">{content.title}</h1>
          <p className="mb-4">{content.description}</p>
          <div className="mb-2">
            <span className="text-sm text-gray-600">{new Date(content.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => like()} 
              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLikeLoading && 'opacity-50 cursor-not-allowed'}`}
              disabled={isLikeLoading}
            >
              Like
            </button>
            <span className="ml-2">{content?.tags?.join(", ")}</span>
          </div>
          
          <section aria-labelledby="comments-title" className="mt-6">
            <h2 id="comments-title" className="text-lg font-medium text-gray-900">
              Comments
            </h2>
            <ul className="divide-y divide-gray-200">
              {comments?.length ? comments.map(comment => (
                <li key={comment.comment_id} className="py-4">
                  <div className="flex space-x-3">
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium text-gray-900">{comment.user_id}</div>
                      <p className="text-sm text-gray-500">{comment.comment_text}</p>
                      <div className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </li>
              )) : (
                <p className="text-sm text-gray-500">No comments yet.</p>
              )}
            </ul>
          </section>
          <Link to="/dashboard" className="inline-block mt-6 text-blue-600 hover:text-blue-800">Go back to Dashboard</Link>
        </div>
      )}
    </>
  );
};

export default UV_ContentDetail;