import { rest } from 'msw';

// Auto-generated MSW Handlers by AI Software Architecture Auditor V4.0 [Run ID: 1077f6d4-cd14-49cd-9187-0147e9df5deb]
export const handlers = [
  rest.get('/api/v1/orders/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.id,
        totalAmount: 149.99,
        creationTimestamp: "2026-09-21T20:00:00Z",
        status: "COMPLETED"
      })
    );
  }),
];
