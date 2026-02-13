// const asyncHandler = (requestHandler) => {
//     return (req,res,next) => {
//         Promise
//          .resolve(requestHandler(req, res, next))
//          .catch((error) => {
//               res.status(error.statusCode).json({
//                  success: false,
//                  message: error.message,
//               });
//             })
//     }
// }

// export { asyncHandler }

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res, next);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

export { asyncHandler };

//my vidtube
// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req,res,next)).catch
//         ((err) => next(err))
//     }
// }

// export {asyncHandler}

//chatgpt

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         return res.status(error.statusCode || 500).json({
//             success: false,
//             message: error.message,
//             errors: error.errors || []
//         })
//     }
// }
