import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase(
    {
      auth: "user",
    },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return Response.json(
          {
            error: "Method not allowed",
          },
          {
            status: 405,
          }
        );
      }

      try {
        /*
         * المستخدم الذي قام بتسجيل الدخول.
         *
         * withSupabase({ auth: "user" })
         * يتحقق من الـ JWT ويضع بيانات المستخدم
         * داخل ctx.userClaims.
         */
        const currentUser = ctx.userClaims;

        if (!currentUser?.id) {
          return Response.json(
            {
              error: "يجب تسجيل الدخول أولًا.",
            },
            {
              status: 401,
            }
          );
        }

        /*
         * التأكد أن المستخدم الحالي هو Root Admin.
         */
        const { data: currentProfile, error: profileError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

        if (
          profileError ||
          !currentProfile ||
          currentProfile.role !== "root_admin"
        ) {
          return Response.json(
            {
              error:
                "غير مسموح. هذه العملية متاحة للـ Root Admin فقط.",
            },
            {
              status: 403,
            }
          );
        }

        /*
         * قراءة البيانات القادمة من الواجهة.
         */
        const body = await req.json();

        const {
          name,
          email,
          password,
          permissions,
        } = body;

        /*
         * التحقق من البيانات الأساسية.
         */
        if (
          typeof name !== "string" ||
          !name.trim() ||
          typeof email !== "string" ||
          !email.trim() ||
          typeof password !== "string" ||
          password.length < 6
        ) {
          return Response.json(
            {
              error:
                "من فضلك أدخل الاسم والبريد الإلكتروني وكلمة مرور لا تقل عن 6 أحرف.",
            },
            {
              status: 400,
            }
          );
        }

        /*
         * إنشاء حساب المشرف في Supabase Auth.
         */
        const {
          data: createdUser,
          error: createUserError,
        } =
          await ctx.supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password,
            email_confirm: true,
          });

        if (createUserError || !createdUser.user) {
          console.error(
            "Create user error:",
            createUserError
          );

          return Response.json(
            {
              error:
                createUserError?.message ||
                "فشل إنشاء حساب المشرف.",
            },
            {
              status: 400,
            }
          );
        }

        const adminId = createdUser.user.id;

        /*
         * إنشاء Profile للمشرف.
         */
        const { error: profileInsertError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .insert({
              id: adminId,
              full_name: name.trim(),
              email: email.trim(),
              role: "admin",
            });

        if (profileInsertError) {
          /*
           * حذف حساب Auth إذا فشل إنشاء Profile.
           */
          await ctx.supabaseAdmin.auth.admin.deleteUser(
            adminId
          );

          console.error(
            "Profile insert error:",
            profileInsertError
          );

          return Response.json(
            {
              error:
                "تم إنشاء الحساب ولكن فشل إنشاء بيانات المشرف.",
            },
            {
              status: 500,
            }
          );
        }

        /*
         * تجهيز صلاحيات المشرف.
         */
        const permissionRows = [
          {
            section: "announcements",
            enabled:
              permissions?.announcements === true,
          },
          {
            section: "events",
            enabled: permissions?.events === true,
          },
          {
            section: "requests",
            enabled: permissions?.requests === true,
          },
          {
            section: "resources",
            enabled:
              permissions?.resources === true,
          },
          {
            section: "faculties",
            enabled:
              permissions?.faculties === true,
          },
          {
            section: "students",
            enabled:
              permissions?.students === true,
          },
        ].map((item) => ({
          admin_id: adminId,
          section: item.section,
          can_view: item.enabled,
          can_add: item.enabled,
          can_edit: item.enabled,
          can_delete: item.enabled,
        }));

        /*
         * حفظ الصلاحيات.
         */
        const { error: permissionsError } =
          await ctx.supabaseAdmin
            .from("admin_permissions")
            .insert(permissionRows);

        if (permissionsError) {
          /*
           * تنظيف البيانات في حالة فشل حفظ الصلاحيات.
           */
          await ctx.supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", adminId);

          await ctx.supabaseAdmin.auth.admin.deleteUser(
            adminId
          );

          console.error(
            "Permissions insert error:",
            permissionsError
          );

          return Response.json(
            {
              error:
                "تم إنشاء الحساب ولكن فشل حفظ الصلاحيات.",
            },
            {
              status: 500,
            }
          );
        }

        /*
         * نجاح العملية بالكامل.
         */
        return Response.json(
          {
            success: true,
            message: "تم إنشاء المشرف بنجاح.",
            admin: {
              id: adminId,
              name: name.trim(),
              email: email.trim(),
              role: "admin",
            },
          },
          {
            status: 201,
          }
        );
      } catch (error) {
        console.error(
          "Unexpected create-admin error:",
          error
        );

        return Response.json(
          {
            error: "حدث خطأ غير متوقع.",
          },
          {
            status: 500,
          }
        );
      }
    }
  ),
};