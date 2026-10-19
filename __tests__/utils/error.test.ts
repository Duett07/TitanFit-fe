import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getErrorMessage, getFieldErrors } from "@/lib/error";

describe("getErrorMessage", () => {
  it("returns fallback when error is null or undefined", () => {
    expect(getErrorMessage(null)).toBe("Đã có lỗi xảy ra. Vui lòng thử lại sau!");
    expect(getErrorMessage(undefined, "Custom fallback")).toBe("Custom fallback");
  });

  it("returns trimmed string when error is a string", () => {
    expect(getErrorMessage("  Tên tài khoản không hợp lệ  ")).toBe("Tên tài khoản không hợp lệ");
  });

  it("extracts message from AxiosError response.data.message", () => {
    const error = new AxiosError("Request failed with status code 400");
    error.response = {
      data: { message: "Mật khẩu không đúng" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    expect(getErrorMessage(error)).toBe("Mật khẩu không đúng");
  });

  it("extracts message from AxiosError response.data.data when string", () => {
    const error = new AxiosError("Request failed with status code 400");
    error.response = {
      data: { data: "Tài khoản đã bị khoá" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    expect(getErrorMessage(error)).toBe("Tài khoản đã bị khoá");
  });

  it("returns standard message for 401 Unauthorized", () => {
    const error = new AxiosError("Unauthorized");
    error.response = {
      data: {},
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    expect(getErrorMessage(error)).toBe(
      "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."
    );
  });

  it("returns network error message when response is missing", () => {
    const error = new AxiosError("Network Error");
    error.code = "ERR_NETWORK";

    expect(getErrorMessage(error)).toBe(
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng!"
    );
  });

  it("handles standard Error instances", () => {
    const error = new Error("Custom JS runtime error");
    expect(getErrorMessage(error)).toBe("Custom JS runtime error");
  });
});

describe("getFieldErrors", () => {
  it("returns null for non-axios errors", () => {
    expect(getFieldErrors(new Error("plain error"))).toBeNull();
    expect(getFieldErrors(null)).toBeNull();
  });

  it("extracts field errors map from response.data.data object", () => {
    const error = new AxiosError("Validation Error");
    error.response = {
      data: {
        message: "Validation failed",
        data: {
          email: "Email không đúng định dạng",
          phone: "Số điện thoại không hợp lệ",
        },
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    const fieldErrors = getFieldErrors(error);
    expect(fieldErrors).toEqual({
      email: "Email không đúng định dạng",
      phone: "Số điện thoại không hợp lệ",
    });
  });

  it("extracts field errors map from response.data.errors array", () => {
    const error = new AxiosError("Validation Error");
    error.response = {
      data: {
        message: "Validation failed",
        errors: [
          { field: "password", message: "Mật khẩu tối thiểu 6 ký tự" },
          { field: "fullName", message: "Họ tên không được để trống" },
        ],
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    const fieldErrors = getFieldErrors(error);
    expect(fieldErrors).toEqual({
      password: "Mật khẩu tối thiểu 6 ký tự",
      fullName: "Họ tên không được để trống",
    });
  });
});
