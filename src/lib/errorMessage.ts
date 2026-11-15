/**
 * Chuyển đổi các mã lỗi kỹ thuật hoặc thông báo tiếng Anh của Supabase
 * thành thông điệp tiếng Việt thân thiện, rõ ràng cho người dùng.
 */
export function getFriendlyErrorMessage(error: unknown, fallbackMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (!error) return fallbackMessage

  const rawMessage =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message)
      : String(error)

  const msg = rawMessage.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Địa chỉ email này chưa được xác nhận. Vui lòng kiểm tra hộp thư đến của bạn.'
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'Email này đã được sử dụng để đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác.'
  }
  if (msg.includes('password should be at least')) {
    return 'Mật khẩu cần có tối thiểu 6 ký tự để đảm bảo an toàn.'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Bạn đã thực hiện quá nhiều thao tác liên tiếp. Vui lòng đợi một lát rồi thử lại.'
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('timeout')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền Internet của bạn.'
  }
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }
  if (msg.includes('jwt') || msg.includes('session expired') || msg.includes('unauthorized')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
  }

  return rawMessage.length < 120 ? rawMessage : fallbackMessage
}
